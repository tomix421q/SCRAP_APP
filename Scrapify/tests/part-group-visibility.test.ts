import { describe, expect, it } from 'vitest';
import { extractSideFromDmc } from '../src/lib/utils/partGroupVisibility';

describe('extractSideFromDmc', () => {
	it('returns null when the DMC has no side code', () => {
		expect(extractSideFromDmc('ABC12345')).toBeNull();
	});

	it('returns the single side code found anywhere in the DMC', () => {
		expect(extractSideFromDmc('ABCRR12345')).toBe('RR');
		expect(extractSideFromDmc('FLABC123')).toBe('FL');
	});

	it('is case-insensitive and normalises to upper case', () => {
		expect(extractSideFromDmc('abcfr123')).toBe('FR');
	});

	it('returns null when different side codes are present (ambiguous)', () => {
		expect(extractSideFromDmc('FRABCRL1')).toBeNull();
	});

	it('returns the side when the same code appears twice', () => {
		expect(extractSideFromDmc('FRABCFR1')).toBe('FR');
	});
});

import {
	describeHiddenReason,
	getHiddenReason,
	type ScanMode,
	type VisibilityFlags
} from '../src/lib/utils/partGroupVisibility';

const visibleGroup: VisibilityFlags = {
	hiddenInScrap: false,
	qadIdentity: 'QAD1',
	hiddenInRebuildFR: false,
	hiddenInRebuildFL: false,
	hiddenInRebuildRR: false,
	hiddenInRebuildRL: false
};
const group = (patch: Partial<VisibilityFlags>): VisibilityFlags => ({ ...visibleGroup, ...patch });
const modes: ScanMode[] = ['scrap', 'rebuild', 'quantity'];

describe('getHiddenReason', () => {
	it('shows a fully enabled group in every mode', () => {
		for (const mode of modes) {
			expect(getHiddenReason(visibleGroup, { mode, dmc: 'ABC123' })).toBeNull();
		}
	});

	it('treats NULL flags as false', () => {
		const nullFlags = group({
			hiddenInRebuildFR: null,
			hiddenInRebuildFL: null,
			hiddenInRebuildRR: null,
			hiddenInRebuildRL: null
		});
		for (const mode of modes) {
			expect(getHiddenReason(nullFlags, { mode, dmc: 'ABCFR123' })).toBeNull();
		}
	});

	it('hides hiddenInScrap groups only in scrap mode', () => {
		const g = group({ hiddenInScrap: true });
		expect(getHiddenReason(g, { mode: 'scrap', dmc: 'ABC' })).toEqual({ rule: 'hiddenInScrap' });
		expect(getHiddenReason(g, { mode: 'rebuild', dmc: 'ABC' })).toBeNull();
		expect(getHiddenReason(g, { mode: 'quantity', dmc: 'ABC' })).toBeNull();
	});

	it('hides groups without QAD identity in scrap and rebuild, not in quantity', () => {
		for (const qadIdentity of [null, '', '   ']) {
			const g = group({ qadIdentity });
			expect(getHiddenReason(g, { mode: 'scrap', dmc: 'ABC' })).toEqual({ rule: 'missingQadIdentity' });
			expect(getHiddenReason(g, { mode: 'rebuild', dmc: 'ABC' })).toEqual({ rule: 'missingQadIdentity' });
			expect(getHiddenReason(g, { mode: 'quantity', dmc: 'ABC' })).toBeNull();
		}
	});

	it('hides a group in rebuild for a flagged side found in the DMC', () => {
		const g = group({ hiddenInRebuildRR: true });
		expect(getHiddenReason(g, { mode: 'rebuild', dmc: 'ABCRR1' })).toEqual({
			rule: 'hiddenInRebuildForSide',
			side: 'RR'
		});
	});

	it('does not hide for side in scrap, quantity, other sides, no side or ambiguous sides', () => {
		const g = group({ hiddenInRebuildRR: true });
		expect(getHiddenReason(g, { mode: 'scrap', dmc: 'ABCRR1' })).toBeNull();
		expect(getHiddenReason(g, { mode: 'quantity', dmc: 'ABCRR1' })).toBeNull();
		expect(getHiddenReason(g, { mode: 'rebuild', dmc: 'ABCFL1' })).toBeNull();
		expect(getHiddenReason(g, { mode: 'rebuild', dmc: 'ABC1' })).toBeNull();
		expect(getHiddenReason(g, { mode: 'rebuild', dmc: 'ABCRRFL1' })).toBeNull();
	});

	it('reports the first matching rule', () => {
		const g = group({ hiddenInScrap: true, qadIdentity: null });
		expect(getHiddenReason(g, { mode: 'scrap', dmc: 'ABC' })).toEqual({ rule: 'hiddenInScrap' });
	});
});

describe('describeHiddenReason', () => {
	it('names the part group and the reason', () => {
		expect(describeHiddenReason({ rule: 'hiddenInRebuildForSide', side: 'FR' }, 'Carrier')).toContain('Carrier');
		expect(describeHiddenReason({ rule: 'hiddenInRebuildForSide', side: 'FR' }, 'Carrier')).toContain('FR');
		expect(describeHiddenReason({ rule: 'hiddenInScrap' }, 'Carrier')).toContain('Carrier');
		expect(describeHiddenReason({ rule: 'missingQadIdentity' }, 'Carrier')).toContain('Carrier');
	});
});
