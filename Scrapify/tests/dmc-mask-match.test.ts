import { describe, expect, it, vi } from 'vitest';

// serverHelp imports auth and Prisma; mock both so the test never touches a real database.
vi.mock('@/server/prisma', () => ({ default: {} }));
vi.mock('@/auth/auth', () => ({ auth: { api: { getSession: vi.fn() } } }));

import { matchDmcWithMask } from '../src/lib/utils/serverHelp';

describe('matchDmcWithMask – optional {SIDE} requirement', () => {
	it('does not require a side code when the mask has no {SIDE}', () => {
		expect(matchDmcWithMask('ABC12345', 'ABC*').isMatch).toBe(true);
		expect(matchDmcWithMask('ABC-XX-1', 'ABC-XX-1').isMatch).toBe(true);
	});

	it.each(['FR', 'FL', 'RR', 'RL'])('accepts a DMC containing %s when {SIDE} is set', (side) => {
		expect(matchDmcWithMask(`ABC${side}12345`, '{SIDE}ABC*').isMatch).toBe(true);
	});

	it('rejects a DMC without a side code when {SIDE} is set', () => {
		expect(matchDmcWithMask('ABC12345', '{SIDE}ABC*')).toEqual({ isMatch: false });
	});

	it('rejects the old RH code', () => {
		expect(matchDmcWithMask('ABCRH12345', '{SIDE}ABC*').isMatch).toBe(false);
	});

	it('removes {SIDE} from the mask wherever it is and in any case', () => {
		expect(matchDmcWithMask('ABC-fr12345', 'ABC-{SIDE}*').isMatch).toBe(true);
		expect(matchDmcWithMask('ABC-RL12345', 'ABC-*{side}').isMatch).toBe(true);
	});

	it('applies {SIDE} to exact masks without *', () => {
		expect(matchDmcWithMask('ABC-FR-1', '{SIDE}abc-fr-1').isMatch).toBe(true);
		expect(matchDmcWithMask('ABC-XX-1', '{SIDE}ABC-XX-1').isMatch).toBe(false);
	});

	it('keeps the serial number when {SIDE} is set', () => {
		expect(matchDmcWithMask('LINE-FR-33020230', '{SIDE}LINE-FR-*')).toEqual({
			isMatch: true,
			serialNumber: '33020230'
		});
	});
});

describe('matchDmcWithMask – mask matching', () => {
	it('returns the first wildcard run as the serial number', () => {
		expect(matchDmcWithMask('LINE-33020230', 'LINE-*')).toEqual({
			isMatch: true,
			serialNumber: '33020230'
		});
	});

	it('rejects a DMC that does not match the mask', () => {
		expect(matchDmcWithMask('XYZ-123', 'ABC-*').isMatch).toBe(false);
	});

	it('treats regex characters in the mask literally', () => {
		expect(matchDmcWithMask('A.B-1', 'A.B-*').isMatch).toBe(true);
		expect(matchDmcWithMask('AXB-1', 'A.B-*').isMatch).toBe(false);
	});

	it('does not let * match non-alphanumeric characters', () => {
		expect(matchDmcWithMask('ABC-12', 'ABC*').isMatch).toBe(false);
	});

	it('ignores surrounding whitespace', () => {
		expect(matchDmcWithMask('  ABC1  ', ' ABC* ').isMatch).toBe(true);
	});
});
