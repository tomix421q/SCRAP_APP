import prismaClient from '@/server/prisma';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { matchDmcWithMask } from '@/utils/serverHelp';
import { saveScrapSchema } from '@/utils/zod';

async function findMatchingLabels(barcode: string) {
	const labelGroups = await prismaClient.labelGroup.findMany({
		include: { groups: { include: { materials: true, scrapCodes: true } } }
	});
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
			// if (
			// 	isRebuild &&
			// 	scrapPayload.filter(
			// 		(row) => row.selectedScrapCode != null && groupsById.get(row.groupId)?.isRebuild
			// 	).length > 1
			// ) {
			// 	return fail(400, {
			// 		success: false,
			// 		message: 'Neplatná voľba rebuild skupín.',
			// 		error: 'V režime rebuild môže mať dôvod scrapu zvolená iba jedna rebuild skupina.'
			// 	});
			// }

			for (const row of scrapPayload) {
				const group = groupsById.get(row.groupId);
				if (!group) {
					return fail(400, {
						success: false,
						message: 'Neplatná skupina dielov.',
						error: 'Údaje naskenovaného labelu sa zmenili. Naskenuj ho znova.'
					});
				}

				const hasSelectedScrapCode = Boolean(row.selectedScrapCode);
				if (!hasSelectedScrapCode && !row.isOtherComponent && !row.isOtherVariant) {
					return fail(400, {
						success: false,
						message: 'Chýba dôvod scrapu.',
						error:
							'Každá uložená skupina musí mať vybraný dôvod, byť označená ako iný komponent alebo mať zvolený iný variant.'
					});
				}

				const selectedScrapCode = hasSelectedScrapCode
					? group.scrapCodes.find((scrapCode) => scrapCode.code === row.selectedScrapCode)
					: undefined;

				if (hasSelectedScrapCode && !selectedScrapCode) {
					return fail(400, {
						success: false,
						message: 'Neplatný dôvod scrapu.',
						error: 'Vybraný dôvod nie je aktívny ani priradený k tejto skupine.'
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
				scrapCode: row.selectedScrapCode || null,
				scrapCodeDescription: row.selectedScrapDescription || null,
				isRebuild,
				isOtherComponent: row.isOtherComponent,
				replacementPartMaterial: row.isOtherVariant ? row.replacementPartMaterial : null,
				quantity: 1,
				description: '',
				createdBy: operator
			}));

			//
			console.log(recordsToInsert);
			await prismaClient.scrapRecord.createMany({
				data: recordsToInsert
			});
			console.log(recordsToInsert);
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
