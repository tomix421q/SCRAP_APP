import { describe, expect, it } from 'vitest';
import { describeError, errorCode } from '../src/lib/utils/describeError';

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

describe('errorCode', () => {
	it('returns a string code', () => {
		expect(errorCode(Object.assign(new Error('x'), { code: 'P2002' }))).toBe('P2002');
	});

	it.each([new Error('x'), Object.assign(new Error('x'), { code: 1 }), null, 'P2002'])(
		'returns undefined for %s',
		(value) => {
			expect(errorCode(value)).toBeUndefined();
		}
	);
});
