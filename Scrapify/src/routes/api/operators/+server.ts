import type { RequestHandler } from './$types';
import prismaClient from '@/server/prisma';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const { cardId } = await request.json();

	try {
		const findOperator = await prismaClient.operator.findFirst({
			where: { cardId: Number(cardId) }
		});
		if (!findOperator) {
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
					message: `Uspesne prihlaseny - ${findOperator?.cardId}`,
					error: false
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
