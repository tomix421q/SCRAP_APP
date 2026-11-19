/**
 * Human-readable message for a caught value of unknown type.
 * Appends a string `code` when present (e.g. Prisma `P2002`).
 */
export function describeError(err: unknown): string {
	if (!(err instanceof Error)) return 'Unknown error';
	const code = 'code' in err && typeof err.code === 'string' ? ` ${err.code}` : '';
	return `${err.message}${code}`;
}
