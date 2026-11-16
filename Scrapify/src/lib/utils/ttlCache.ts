/**
 * In-memory cache of async results by key, each kept for `ttlMs`.
 * Concurrent calls with the same key share one pending promise; a rejected
 * promise is dropped right away so the next call tries again.
 */
export function createTtlCache<T>(ttlMs: number) {
	const entries = new Map<string, { expiresAt: number; value: Promise<T> }>();

	function removeExpired(now: number) {
		for (const [key, entry] of entries) {
			if (entry.expiresAt <= now) entries.delete(key);
		}
	}

	return {
		get(key: string, compute: () => Promise<T>): Promise<T> {
			const now = Date.now();
			const cached = entries.get(key);
			if (cached && cached.expiresAt > now) return cached.value;

			// Keys can be unbounded (e.g. custom date ranges), so prune on every miss.
			removeExpired(now);
			const value = compute();
			entries.set(key, { expiresAt: now + ttlMs, value });
			value.catch(() => {
				if (entries.get(key)?.value === value) entries.delete(key);
			});
			return value;
		}
	};
}
