import { describe, expect, it } from 'vitest';
import { describeError } from '../src/lib/utils/describeError';

describe('describeError', () => {
	it('returns the message of a plain Error', () => {
		expect(describeError(new Error('Boom'))).toBe('Boom');
	});

	it('appends a string error code (e.g. Prisma P2002)', () => {
		const err = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
		expect(describeError(err)).toBe('Unique constraint P2002');
	});

	it('ignores a non-string code', () => {
		const err = Object.assign(new Error('Boom'), { code: 42 });
		expect(describeError(err)).toBe('Boom');
	});

	it.each([null, undefined, 'text', 42, {}])('falls back for a non-Error value %s', (value) => {
		expect(describeError(value)).toBe('Unknown error');
	});
});
