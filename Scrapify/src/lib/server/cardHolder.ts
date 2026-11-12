import prismaClient from '@/server/prisma';

/** Who a scanned card belongs to: a shop-floor operator or a registered user account. */
export type CardHolder = { fullName: string };

/**
 * Resolves a card ID to the operator or user account that may record scrap with it.
 * An operator wins when both share the card (same rule as names on `scrapRecords`).
 */
export async function findCardHolder(cardId: number): Promise<CardHolder | null> {
	const [operator, user] = await Promise.all([
		prismaClient.operator.findUnique({ where: { cardId }, select: { fullName: true } }),
		prismaClient.user.findUnique({ where: { cardId }, select: { name: true } })
	]);
	if (operator) return { fullName: operator.fullName };
	if (user) return { fullName: user.name };
	return null;
}
