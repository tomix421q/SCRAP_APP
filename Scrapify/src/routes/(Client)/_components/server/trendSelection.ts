import { error } from '@sveltejs/kit';

export const trendSelectionKinds = ['partGroup', 'scrapCode'] as const;
export type TrendSelectionKind = (typeof trendSelectionKinds)[number];

/** The part group (`id` is its numeric id) or scrap code the "Trend of selection" tile follows. */
export type TrendSelection =
	| { kind: 'partGroup'; id: number }
	| { kind: 'scrapCode'; code: string };

/** Longest scrap code accepted from the URL; real codes are a few characters. */
const maxScrapCodeLength = 50;

/**
 * Parses the `trend` query parameter (`partGroup:<id>` or `scrapCode:<code>`).
 * Returns `undefined` when absent and throws a 400 error for any other invalid value.
 */
export function parseTrendSelection(value: string | null): TrendSelection | undefined {
	if (value === null || value === '') return undefined;
	const separator = value.indexOf(':');
	const kind = separator === -1 ? '' : value.slice(0, separator);
	const rest = separator === -1 ? '' : value.slice(separator + 1);

	if (kind === 'partGroup' && /^[1-9]\d{0,9}$/.test(rest) && Number(rest) <= 2_147_483_647) {
		return { kind, id: Number(rest) };
	}
	if (kind === 'scrapCode') {
		const code = rest.trim();
		if (code && code.length <= maxScrapCodeLength) return { kind, code };
	}
	throw error(400, {
		message: 'Invalid trend selection. Use partGroup:<id> or scrapCode:<code>.'
	});
}

/** Inverse of `parseTrendSelection`, the value of the `trend` query parameter. */
export function formatTrendSelection(selection: TrendSelection): string {
	return selection.kind === 'partGroup'
		? `partGroup:${selection.id}`
		: `scrapCode:${selection.code}`;
}
