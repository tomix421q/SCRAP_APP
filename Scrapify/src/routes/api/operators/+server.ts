import type { RequestHandler } from './$types';
import { findCardHolder } from '@/server/cardHolder';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const { cardId } = await request.json();

	try {
		// Operators and registered users (e.g. engineers) may both record scrap with their card.
		const parsedCardId = Number(cardId);
		const cardHolder = Number.isSafeInteger(parsedCardId)
			? await findCardHolder(parsedCardId)
			: null;
		if (!cardHolder) {
			return json(
				{
					success: false,
					message: `Not found`,
					error: `Toto card ID - ${cardId} neexistuje v databaze. Kontaktuj procesneho inziniera.`
				},
				{ status: 404 }
			);
		} else {
			return json(
				{
					success: true,
					message: `Uspesne prihlaseny - ${parsedCardId}`,
					error: false,
					fullName: cardHolder.fullName
				},
				{ status: 200 }
			);
		}
	} catch (error: any) {
		return json(
			{
				message: `Something is wrong :( Please try again later.`,
				success: false,
				error: error.message + ' ' + error.code || 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
