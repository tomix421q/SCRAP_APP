import prismaClient from '@/server/prisma';
import { fail, type Action, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { matchDmcWithMask } from '@/utils/serverHelp';

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
		const labelGroups = await prismaClient.labelGroup.findMany({
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
		});

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
		console.log(matchedLabel);

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

		// const allPartsInLabel = matchedLabel.groups.flatMap((g) => g.parts);
		return {
			success: true,
			message: `Dmc ${barcode} bol úspešne nájdený.`,
			data: { match: matchedLabel, scrapCodes }
		};
	}
} satisfies Actions;
