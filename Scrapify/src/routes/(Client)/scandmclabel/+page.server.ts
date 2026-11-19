import { randomUUID } from 'node:crypto';
import prismaClient from '@/server/prisma';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { matchDmcWithMask } from '@/utils/serverHelp';
import { describeHiddenReason, getHiddenReason } from '@/utils/partGroupVisibility';
import { saveQuantityScrapSchema, saveScrapSchema } from '@/utils/zod';
import { quantityScrapLabelPrefix } from '@/utils/quantityScrap';
import { loadOperatorHistory } from './_components/utils/history.server';
import { findCardHolder } from '@/server/cardHolder';
import { denyUnlessLabelAllowed, getAllowedLabelIds } from '@/server/operatorLabelAccess';
import { dateTimeLocalTimeDb } from '@/utils/index';
import type { ExistingRebuild } from './_components/ScrapManager.svelte';

async function findMatchingLabels(barcode: string) {
	const labelGroups = await prismaClient.labelGroup.findMany({
		include: {
			groups: { include: { materials: true, scrapCodes: true }, orderBy: { isRebuild: 'desc' } }
		}
	});
	return labelGroups.filter((labelGroup) => matchDmcWithMask(barcode, labelGroup.code).isMatch);
}

/** Latest rebuild saved under this exact DMC; a DMC can be rebuilt only once. */
async function findExistingRebuild(dmc: string): Promise<ExistingRebuild | null> {
	const record = await prismaClient.scrapRecord.findFirst({
		where: { dmc, isRebuild: true },
		select: { createdAt: true, createdBy: true },
		orderBy: { createdAt: 'desc' }
	});
	return record
		? { createdAt: dateTimeLocalTimeDb(record.createdAt), createdBy: record.createdBy }
		: null;
}

async function findQuantityScrapLabels() {
	return prismaClient.labelGroup.findMany({
		where: {
			code: { startsWith: quantityScrapLabelPrefix },
			groups: { some: {} }
		},
		include: {
			groups: { include: { materials: true, scrapCodes: true }, orderBy: { isRebuild: 'desc' } }
		},
		orderBy: { code: 'asc' }
	});
}

export const load = (async () => {
	return { quantityScrapLabels: await findQuantityScrapLabels() };
}) satisfies PageServerLoad;

export const actions = {
	/** Quantity scrap labels the card holder may use; all of them when unrestricted. */
	allowedQuantityScrapLabels: async ({ request }) => {
		const formData = await request.formData();
		const operator = String(formData.get('operator') ?? '').trim();
		const cardId = /^\d+$/.test(operator) ? Number(operator) : NaN;
		if (!Number.isSafeInteger(cardId) || cardId <= 0) {
			return fail(400, {
				success: false,
				message: 'Neplatné ID operátora.',
				error: 'Prihlás sa znova platnou kartou operátora.'
			});
		}

		try {
			const [allowedIds, labels] = await Promise.all([
				getAllowedLabelIds(cardId),
				findQuantityScrapLabels()
			]);
			return {
				success: true,
				message: 'Labely boli načítané.',
				labels: allowedIds === null ? labels : labels.filter((label) => allowedIds.has(label.id))
			};
		} catch (err) {
			console.error('Failed to load allowed quantity scrap labels:', err);
			return fail(500, {
				success: false,
				message: 'Nepodarilo sa načítať quantity scrap labely.',
				error: 'Skús to znova alebo kontaktuj správcu.'
			});
		}
	},
	history: async ({ request }) => {
		const formData = await request.formData();
		const operator = String(formData.get('operator') ?? '').trim();
		// Digits only: `Number()` would also accept forms like "1e3" that never match `createdBy`.
		const parsedCardId = /^\d+$/.test(operator) ? Number(operator) : NaN;
		if (!Number.isSafeInteger(parsedCardId) || parsedCardId <= 0) {
			return fail(400, {
				success: false,
				message: 'Neplatné ID operátora.',
				error: 'Prihlás sa znova platnou kartou operátora.'
			});
		}

		try {
			// `createdBy` holds the card ID string exactly as sent when saving.
			const history = await loadOperatorHistory(operator);
			return { success: true, message: 'História bola načítaná.', ...history };
		} catch (err) {
			console.error('Failed to load operator history:', err);
			return fail(500, {
				success: false,
				message: 'Nepodarilo sa načítať históriu.',
				error: 'Skús to znova alebo kontaktuj správcu.'
			});
		}
	},
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

			// Without a valid card the scan stays open (as before); saving always requires a card.
			const operator = String(formData.get('operator') ?? '').trim();
			if (/^\d+$/.test(operator) && Number.isSafeInteger(Number(operator))) {
				const cardId = Number(operator);
				const cardHolder = await findCardHolder(cardId);
				if (cardHolder) {
					const denied = await denyUnlessLabelAllowed(
						cardId,
						cardHolder.fullName,
						matchedLabels[0]
					);
					if (denied) return denied;
				}
			}

			const existingRebuild = await findExistingRebuild(barcode);

			return {
				success: true,
				message: `Dmc ${barcode} bol úspešne nájdený.`,
				warning: existingRebuild
					? `Tento DMC už bol rebuildovaný (${existingRebuild.createdAt}, operátor ${existingRebuild.createdBy}). Ďalší rebuild nie je možný.`
					: undefined,
				data: { label: barcode, match: matchedLabels[0], existingRebuild }
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

			const [matchedLabels, cardHolder, existingRebuild] = await Promise.all([
				findMatchingLabels(dmc),
				findCardHolder(operatorCardId),
				isRebuild ? findExistingRebuild(dmc) : null
			]);

			if (!cardHolder) {
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
			const denied = await denyUnlessLabelAllowed(
				operatorCardId,
				cardHolder.fullName,
				matchedLabels[0]
			);
			if (denied) return denied;

			// Re-checked on save: the scan may be stale, or the form submitted twice.
			if (existingRebuild) {
				return fail(409, {
					success: false,
					message: 'Rebuild už existuje.',
					error: `DMC ${dmc} už bol rebuildovaný (${existingRebuild.createdAt}, operátor ${existingRebuild.createdBy}). Ďalší rebuild nie je povolený.`
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

			const visibilityContext = { mode: isRebuild ? 'rebuild' : 'scrap', dmc } as const;

			for (const row of scrapPayload) {
				const group = groupsById.get(row.groupId);
				if (!group) {
					return fail(400, {
						success: false,
						message: 'Neplatná skupina dielov.',
						error: 'Údaje naskenovaného labelu sa zmenili. Naskenuj ho znova.'
					});
				}

				// A part group hidden by a visibility rule (scrap flag, missing QAD identity, rebuild side) can neither be scrapped nor be a cause.
				const hiddenReason = getHiddenReason(group, visibilityContext);
				if (hiddenReason) {
					return fail(400, {
						success: false,
						message: 'Neplatná skupina dielov.',
						error: describeHiddenReason(hiddenReason, group.interfaceName)
					});
				}

				// An other component row's own code is ignored (it gets its cause's code below).
				const hasSelectedScrapCode = Boolean(row.selectedScrapCode) && !row.isOtherComponent;
				if (!hasSelectedScrapCode && !row.isOtherComponent && !row.isOtherVariant) {
					return fail(400, {
						success: false,
						message: 'Chýba dôvod scrapu.',
						error:
							'Každá uložená skupina musí mať vybraný dôvod, byť označená ako iný komponent alebo mať zvolený iný variant.'
					});
				}

				// A flagged group has no Other component scrap code, so it can never be the main reason in a rebuild.
				if (isRebuild && group.cannotBeMainReason && (hasSelectedScrapCode || row.isOtherVariant)) {
					return fail(400, {
						success: false,
						message: 'Neplatný dôvod scrapu.',
						error: `Part group ${group.interfaceName} nemôže byť príčinou rebuildu.`
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

			// Other component rows get the Other component scrap code of their cause, read from the DB.
			// The schema already guarantees the cause is another row of this payload with a selected reason.
			const otherComponentCodes = new Map<number, { code: string; description: string | null }>();
			for (const row of scrapPayload) {
				if (!row.isOtherComponent || row.otherComponentCauseGroupId == null) continue;
				const causeGroup = groupsById.get(row.otherComponentCauseGroupId);
				const causeCode = causeGroup?.scrapCodes.find((scrapCode) => scrapCode.isOtherComponent);
				const causeHiddenReason = causeGroup && getHiddenReason(causeGroup, visibilityContext);
				if (causeGroup && causeHiddenReason) {
					return fail(400, {
						success: false,
						message: 'Neplatná príčina iného komponentu.',
						error: describeHiddenReason(causeHiddenReason, causeGroup.interfaceName)
					});
				}
				// In rebuild the cause is always the main reason, which only a rebuild group can carry.
				if (isRebuild && causeGroup && !causeGroup.isRebuild) {
					return fail(400, {
						success: false,
						message: 'Neplatná príčina iného komponentu.',
						error: 'Pri rebuilde môže byť príčinou iba rebuild skupina s hlavným dôvodom.'
					});
				}
				if (isRebuild && causeGroup?.cannotBeMainReason) {
					return fail(400, {
						success: false,
						message: 'Neplatná príčina iného komponentu.',
						error: `Part group ${causeGroup.interfaceName} nemôže byť príčinou rebuildu.`
					});
				}
				if (!causeGroup || !causeCode) {
					return fail(400, {
						success: false,
						message: 'Chýba kód pre iný komponent.',
						error: `Part group ${causeGroup?.interfaceName ?? ''} nemá nastavený kód pre iný komponent, kontaktuj inžiniera.`
					});
				}
				otherComponentCodes.set(row.groupId, causeCode);
			}

			// One ID shared by every record of this submit; generated here, never taken from the client.
			const payloadRecId = randomUUID();
			const recordsToInsert = scrapPayload.map((row) => {
				const otherComponentCode = otherComponentCodes.get(row.groupId);
				return {
					dmc,
					payloadRecId,
					partGroupId: row.groupId,
					scrapCode: otherComponentCode ? otherComponentCode.code : row.selectedScrapCode || null,
					scrapCodeDescription: otherComponentCode
						? otherComponentCode.description
						: row.selectedScrapDescription || null,
					isRebuild,
					isOtherComponent: row.isOtherComponent,
					replacementPartMaterial: row.isOtherVariant ? row.replacementPartMaterial : null,
					quantity: 1,
					description: '',
					createdBy: operator
				};
			});

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
	},
	saveQuantityScrap: async (event) => {
		const rawData = Object.fromEntries(await event.request.formData());
		const result = saveQuantityScrapSchema.safeParse(rawData);
		if (!result.success) {
			return fail(400, {
				success: false,
				message: 'Validation failed',
				error: result.error.flatten((issue) => issue.message).fieldErrors,
				values: rawData
			});
		}

		const { dmc, labelGroupId, operator, scrapPayload } = result.data;

		try {
			const operatorCardId = Number(operator);
			if (!Number.isSafeInteger(operatorCardId) || operatorCardId <= 0) {
				return fail(400, {
					success: false,
					message: 'Neplatné ID operátora.',
					error: 'Prihlás sa znova platnou kartou operátora.'
				});
			}

			const [quantityScrapLabel, cardHolder] = await Promise.all([
				prismaClient.labelGroup.findUnique({
					where: { id: labelGroupId },
					include: {
						groups: {
							include: { materials: true, scrapCodes: true },
							orderBy: { isRebuild: 'desc' }
						}
					}
				}),
				findCardHolder(operatorCardId)
			]);

			if (!cardHolder) {
				return fail(403, {
					success: false,
					message: 'Operátor nebol overený.',
					error: 'Prihlás sa znova platnou kartou operátora.'
				});
			}

			if (!quantityScrapLabel) {
				return fail(404, {
					success: false,
					message: 'Quantity scrap label sa nenašiel.',
					error: 'Vybraná linka už nie je nakonfigurovaná. Obnov stránku a skús to znova.'
				});
			}

			const denied = await denyUnlessLabelAllowed(
				operatorCardId,
				cardHolder.fullName,
				quantityScrapLabel
			);
			if (denied) return denied;

			if (
				!quantityScrapLabel.code.startsWith(quantityScrapLabelPrefix) ||
				quantityScrapLabel.code !== dmc ||
				quantityScrapLabel.groups.length === 0
			) {
				return fail(400, {
					success: false,
					message: 'Neplatný quantity scrap label.',
					error: 'Vybraná linka nie je správne nakonfigurovaná.'
				});
			}

			const groupsById = new Set(quantityScrapLabel.groups.map((group) => group.id));
			if (scrapPayload.some((row) => !groupsById.has(row.groupId))) {
				return fail(400, {
					success: false,
					message: 'Neplatná skupina dielov.',
					error: 'Odoslaná skupina nie je nakonfigurovaná pod vybraným quantity scrap labelom.'
				});
			}

			// One ID shared by every record of this submit; generated here, never taken from the client.
			const payloadRecId = randomUUID();
			await prismaClient.scrapRecord.createMany({
				data: scrapPayload.map((row) => ({
					dmc,
					payloadRecId,
					partGroupId: row.groupId,
					scrapCode: row.selectedScrapCode,
					scrapCodeDescription: row.selectedScrapDescription ?? null,
					isRebuild: false,
					isOtherComponent: false,
					replacementPartMaterial: row.replacementPartMaterial,
					quantity: row.quantity,
					description: '',
					createdBy: operator
				}))
			});

			return {
				success: true,
				message: `👍 Quantity scrap pre label ${dmc} bol úspešne zaevidovaný.`
			};
		} catch (err) {
			console.error('Failed to save quantity scrap records:', err);
			return fail(500, {
				success: false,
				message: 'Nepodarilo sa uložiť quantity scrap do databázy.',
				error: 'Skús to znova alebo kontaktuj správcu.'
			});
		}
	}
} satisfies Actions;
