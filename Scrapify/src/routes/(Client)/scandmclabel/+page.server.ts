import prismaClient from '@/server/prisma';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { matchDmcWithMask } from '@/utils/serverHelp';
import { saveScrapSchema } from '@/utils/zod';

const scanInclude = {
	groups: {
		include: {
			materials: true,
			scrapCodes: {
				where: { active: true }
			}
		}
	}
} satisfies import('@prisma/client').Prisma.LabelGroupInclude;

async function findMatchingLabels(barcode: string) {
	const labelGroups = await prismaClient.labelGroup.findMany({ include: scanInclude });
	return labelGroups.filter((labelGroup) => matchDmcWithMask(barcode, labelGroup.code).isMatch);
}

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;

export const actions = {
	scanDmc: async ({ request }) => {
		const formData = await request.formData();
		const barcode = String(formData.get('barcode') ?? '').trim();

		if (!barcode) {
			return fail(400, { success: false, message: 'Validácia', error: 'Kód je prázdny.' });
		}

		try {
			const matchedLabels = await findMatchingLabels(barcode);
			if (matchedLabels.length === 0) {
				return fail(404, {
					success: false,
					message: 'Error',
					error: `Žiadna maska nezodpovedá scanu: "${barcode}"`
				});
			}

			if (matchedLabels.length > 1) {
				return fail(409, {
					success: false,
					message: 'Nejednoznačný scan',
					error: `Kód "${barcode}" zodpovedá viacerým projektom. Kontaktujte správcu.`
				});
			}

			return {
				success: true,
				message: `Dmc ${barcode} bol úspešne nájdený.`,
				data: { label: barcode, match: matchedLabels[0] }
			};
		} catch (err) {
			console.error('Failed to scan DMC label:', err);
			return fail(500, {
				success: false,
				message: 'Nepodarilo sa načítať label.',
				error: 'Skús to znova alebo kontaktuj správcu.'
			});
		}
	},
	saveScrap: async (event) => {
		const rawData = Object.fromEntries(await event.request.formData());

		const result = saveScrapSchema.safeParse(rawData);
		if (!result.success) {
			return fail(400, {
				success: false,
				message: 'Validation failed',
				error: result.error.flatten((issue) => issue.message).fieldErrors,
				values: rawData
			});
		}
		const { dmc, isRebuild, operator, scrapPayload } = result.data;

		try {
			const operatorCardId = Number(operator);
			if (!Number.isSafeInteger(operatorCardId) || operatorCardId <= 0) {
				return fail(400, {
					success: false,
					message: 'Neplatné ID operátora.',
					error: 'Prihlás sa znova platnou kartou operátora.'
				});
			}

			const [matchedLabels, registeredOperator, registeredUser] = await Promise.all([
				findMatchingLabels(dmc),
				prismaClient.operator.findUnique({
					where: { cardId: operatorCardId },
					select: { cardId: true }
				}),
				prismaClient.user.findUnique({
					where: { cardId: operatorCardId },
					select: { cardId: true }
				})
			]);

			if (!registeredOperator && !registeredUser) {
				return fail(403, {
					success: false,
					message: 'Operátor nebol overený.',
					error: 'Prihlás sa znova platnou kartou operátora.'
				});
			}

			if (matchedLabels.length !== 1) {
				return fail(matchedLabels.length === 0 ? 404 : 409, {
					success: false,
					message: matchedLabels.length === 0 ? 'Label sa nenašiel.' : 'Nejednoznačný scan',
					error:
						matchedLabels.length === 0
							? `Žiadna maska nezodpovedá scanu: "${dmc}"`
							: `Kód "${dmc}" zodpovedá viacerým projektom. Kontaktujte správcu.`
				});
			}

			const groupsById = new Map(matchedLabels[0].groups.map((group) => [group.id, group]));
			if (
				isRebuild &&
				scrapPayload.filter(
					(row) => row.selectedScrapId != null && groupsById.get(row.groupId)?.isRebuild
				).length > 1
			) {
				return fail(400, {
					success: false,
					message: 'Neplatná voľba rebuild skupín.',
					error: 'V režime rebuild môže mať dôvod scrapu zvolená iba jedna rebuild skupina.'
				});
			}

			for (const row of scrapPayload) {
				const group = groupsById.get(row.groupId);
				if (!group) {
					return fail(400, {
						success: false,
						message: 'Neplatná skupina dielov.',
						error: 'Údaje naskenovaného labelu sa zmenili. Naskenuj ho znova.'
					});
				}

				if (row.selectedScrapId == null && !row.isOtherComponent) {
					return fail(400, {
						success: false,
						message: 'Chýba dôvod scrapu.',
						error:
							'Každá uložená skupina musí mať vybraný dôvod alebo byť označená ako iný komponent.'
					});
				}

				const selectedScrapCode =
					row.selectedScrapId == null
						? undefined
						: group.scrapCodes.find((scrapCode) => scrapCode.id === row.selectedScrapId);
				if (row.selectedScrapId != null && !selectedScrapCode) {
					return fail(400, {
						success: false,
						message: 'Neplatný dôvod scrapu.',
						error: 'Vybraný dôvod nie je aktívny ani priradený k tejto skupine.'
					});
				}

				if (row.isOtherComponent && (!isRebuild || !group.isRebuild)) {
					return fail(400, {
						success: false,
						message: 'Neplatná voľba komponentu.',
						error: 'Iný komponent je dostupný iba pre rebuild skupinu.'
					});
				}

				const isOtherVariantCode =
					selectedScrapCode !== undefined &&
					(selectedScrapCode.name.toLowerCase().includes('iný variant') ||
						selectedScrapCode.name.toLowerCase().includes('iny variant'));
				if (row.isOtherVariant !== isOtherVariantCode) {
					return fail(400, {
						success: false,
						message: 'Neplatná voľba variantu.',
						error: 'Znova vyber dôvod scrapu pre tento diel.'
					});
				}

				if (
					row.isOtherVariant &&
					!group.materials.some((material) => material.material === row.replacementPartMaterial)
				) {
					return fail(400, {
						success: false,
						message: 'Neplatný náhradný materiál.',
						error: 'Vybraný materiál nie je priradený k tejto skupine dielov.'
					});
				}
			}

			const recordsToInsert = scrapPayload.map((row) => ({
				dmc,
				partGroupId: row.groupId,
				scrapCodeId: row.selectedScrapId ?? null,
				isRebuild,
				replacementPartMaterial: row.isOtherVariant ? row.replacementPartMaterial : null,
				isOtherComponent: row.isOtherComponent,
				quantity: 1,
				description: '',
				createdBy: operator
			}));

			//
			console.log(recordsToInsert);
			await prismaClient.scrapRecord.createMany({
				data: recordsToInsert
			});

			return {
				success: true,
				message: `👍 Scrap pre Label:${dmc} bol úspešne zaevidovaný `
			};
		} catch (err) {
			console.error('Failed to save scrap records:', err);
			return fail(500, {
				success: false,
				message: 'Nepodarilo sa ulozit zaznam do databazy.',
				error: 'Skús to znova alebo kontaktuj správcu.'
			});
		}
	}
} satisfies Actions;
