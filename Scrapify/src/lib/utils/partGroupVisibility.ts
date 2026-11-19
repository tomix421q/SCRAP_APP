import type { PartGroup } from '@prisma/client';

export const PART_SIDES = ['FR', 'FL', 'RR', 'RL'] as const;
export type PartSide = (typeof PART_SIDES)[number];

const SIDE_PATTERN = PART_SIDES.join('|');

/** Matches any side code anywhere in a DMC (case-insensitive, not global). */
export const SIDE_CODE_REGEX = new RegExp(SIDE_PATTERN, 'i');

export type ScanMode = 'scrap' | 'rebuild' | 'quantity';

/** Context of one scan the rules are evaluated against. */
export interface VisibilityContext {
	mode: ScanMode;
	dmc: string;
}

/** Part group fields the rules read (subset of PartGroup). */
export type VisibilityFlags = Pick<
	PartGroup,
	| 'hiddenInScrap'
	| 'qadIdentity'
	| 'hiddenInRebuildFR'
	| 'hiddenInRebuildFL'
	| 'hiddenInRebuildRR'
	| 'hiddenInRebuildRL'
>;

export type HiddenReason =
	| { rule: 'hiddenInScrap' }
	| { rule: 'missingQadIdentity' }
	| { rule: 'hiddenInRebuildForSide'; side: PartSide };

/** One rule: returns a reason when it hides the part group, otherwise null. */
type VisibilityRule = (group: VisibilityFlags, ctx: VisibilityContext) => HiddenReason | null;

/** The single side code found in the DMC; null when none or ambiguous. */
export function extractSideFromDmc(dmc: string): PartSide | null {
	const found = new Set(
		(dmc.match(new RegExp(SIDE_PATTERN, 'gi')) ?? []).map((m) => m.toUpperCase())
	);
	if (found.size !== 1) return null;
	return [...found][0] as PartSide;
}

const hiddenInScrapRule: VisibilityRule = (group, ctx) =>
	ctx.mode === 'scrap' && group.hiddenInScrap ? { rule: 'hiddenInScrap' } : null;

const missingQadIdentityRule: VisibilityRule = (group, ctx) =>
	ctx.mode !== 'quantity' && !group.qadIdentity?.trim() ? { rule: 'missingQadIdentity' } : null;

const hiddenInRebuildForSideRule: VisibilityRule = (group, ctx) => {
	if (ctx.mode !== 'rebuild') return null;
	const side = extractSideFromDmc(ctx.dmc);
	if (!side) return null;
	return group[`hiddenInRebuild${side}`] ? { rule: 'hiddenInRebuildForSide', side } : null;
};

const VISIBILITY_RULES: readonly VisibilityRule[] = [
	hiddenInScrapRule,
	missingQadIdentityRule,
	hiddenInRebuildForSideRule
];

/** First rule that hides the part group in this context, or null when it is visible. */
export function getHiddenReason(
	group: VisibilityFlags,
	ctx: VisibilityContext
): HiddenReason | null {
	for (const rule of VISIBILITY_RULES) {
		const reason = rule(group, ctx);
		if (reason) return reason;
	}
	return null;
}

/** Operator-facing message for a hidden reason (used in fail() and UI). */
export function describeHiddenReason(reason: HiddenReason, interfaceName: string): string {
	switch (reason.rule) {
		case 'hiddenInScrap':
			return `Part group ${interfaceName} nie je v scrap móde zapnutá.`;
		case 'missingQadIdentity':
			return `Part group ${interfaceName} nemá QAD identity, je dostupná iba v quantity scrape.`;
		case 'hiddenInRebuildForSide':
			return `Part group ${interfaceName} je v rebuilde skrytá pre stranu ${reason.side}.`;
	}
}
