import prismaClient from '@/server/prisma';
import { fail } from '@sveltejs/kit';

/**
 * Label groups (masks) a card may scan and save scrap for.
 * Returns `null` when unrestricted: a user account, or an operator without `hasLabelRestriction`.
 * Otherwise returns the allowed label group IDs, which may be empty (nothing allowed).
 * An operator wins when both share the card (same rule as `findCardHolder`).
 */
export async function getAllowedLabelIds(cardId: number): Promise<Set<number> | null> {
	const operator = await prismaClient.operator.findUnique({
		where: { cardId },
		select: { hasLabelRestriction: true, allowedLabels: { select: { id: true } } }
	});
	if (!operator) return null;
	if (operator.hasLabelRestriction !== true) return null;
	return new Set((operator.allowedLabels ?? []).map((label) => label.id));
}

/**
 * Returns a 403 failure when the card may not use this label group, otherwise `null`.
 * `holderName` is shown in the message so the operator knows who was rejected.
 */
export async function denyUnlessLabelAllowed(
	cardId: number,
	holderName: string,
	label: { id: number; code: string; vProject: string | null }
) {
	const allowedIds = await getAllowedLabelIds(cardId);
	if (allowedIds === null || allowedIds.has(label.id)) return null;

	const project = label.vProject ? ` (${label.vProject})` : '';
	return fail(403, {
		success: false,
		message: 'Maska nie je povolená.',
		error: `Operátor ${holderName} nemá povolenú masku ${label.code}${project}. Kontaktujte správcu.`
	});
}
