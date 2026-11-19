/** String `code` of a caught error (e.g. Prisma `P2002`), or `undefined` when it has none. */
export function errorCode(err: unknown): string | undefined {
	if (!(err instanceof Error)) return undefined;
	return 'code' in err && typeof err.code === 'string' ? err.code : undefined;
}

/**
 * Human-readable message for a caught value of unknown type.
 * Appends a string `code` when present (e.g. Prisma `P2002`).
 */
export function describeError(err: unknown): string {
	if (!(err instanceof Error)) return 'Unknown error';
	const code = errorCode(err);
	return code ? `${err.message} ${code}` : err.message;
}
