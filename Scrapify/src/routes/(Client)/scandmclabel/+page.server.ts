import prismaClient from '@/server/prisma';
import { fail, type Action, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { matchDmcWithMask } from '@/utils/serverHelp';
import { saveScrapSchema } from '@/utils/zod';

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;

export const actions = {
	scanDmc: async ({ request }) => {
		const formData = await request.formData();
		const barcode = String(formData.get('barcode') || '').trim();

		if (!barcode) {
			return fail(400, { success: false, message: 'Validacia', error: 'Kód je prázdny.' });
		}

		try {
			const [labelGroups] = await prismaClient.$transaction([
				prismaClient.labelGroup.findMany({
					include: {
						process: true,
						project: true,
						groups: {
							include: {
								parts: true,
								scrapCodes: true
							}
						}
					}
				})
			]);
			let matchedLabel: (typeof labelGroups)[number] | null = null;
			let extractedSerial: string | undefined = undefined;

			for (const lg of labelGroups) {
				const { isMatch, serialNumber } = matchDmcWithMask(barcode, lg.code);
				if (isMatch) {
					matchedLabel = lg;
					extractedSerial = serialNumber;
					break;
				}
			}

			if (!matchedLabel) {
				return fail(404, {
					success: false,
					message: 'Error',
					error: `Ziadna maska nezodpovoda scanu: "${barcode}"`
				});
			}
			const scrapCodes = await prismaClient.scrapCode.findMany({
				where: {
					processId: matchedLabel.processId
				}
			});
			// console.log(matchedLabel);
			// const allPartsInLabel = matchedLabel.groups.flatMap((g) => g.parts);
			return {
				success: true,
				message: `Dmc ${barcode} bol úspešne nájdený.`,
				data: { label: barcode, match: matchedLabel, scrapCodes }
			};
		} catch {}
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
		console.log(result.data);
		const { dmc, isRebuild,operator, scrapPayload } = result.data;

		try {
			const recordsToInsert = scrapPayload.map((row) => ({
				dmc,
				partGroupId: Number(row.groupId),
				scrapCodeId: Number(row.selectedScrapId) ?? null,
				isRebuild,
				replacementPartId:
					row.isOtherVariant && row.replacementPartId && row.replacementPartId
						? Number(row.replacementPartId)
						: null,
				isOtherComponent: row.isOtherComponent,
				quantity: 1,
				description: '',
				createdBy: operator
			}));

			const created = await prismaClient.scrapRecord.createMany({
				data: recordsToInsert
			});

			return {
				success: true,
				message: `👍 Scrap pre Label:${dmc} bol úspešne zaevidovaný `
			};
		} catch (err: any) {
			console.log('Problem with db', err);
			return fail(500, {
				success: false,
				message: 'Nepodarilo sa ulozit zaznam do databazy.',
				error: err.message
			});
		}
	}
} satisfies Actions;
