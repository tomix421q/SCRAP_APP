import { auth } from '@/auth/auth';
import prismaClient from '@/server/prisma';
import { fail, type ActionFailure } from '@sveltejs/kit';
import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import type { LoggerActionType, LoggerEntityType, Role } from './types';

export const toFuzzyPattern = (str: string) => {
	const item = str
		.trim()
		.split(/\s+/)
		.filter((item) => Boolean(item))
		.join('%');
	return item;
};

export async function getUserServer({ request }: { request: Request }) {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	return { user: session?.user ?? null, session: session?.session ?? null };
}

/**
 * True when the current session belongs to a user whose DB role is one of `roles`.
 * Form actions are plain POST endpoints, so they cannot rely on a layout `load` guard.
 */
export async function hasRoleServer({ request }: { request: Request }, roles: readonly Role[]) {
	const { user } = await getUserServer({ request });
	if (!user) return false;
	const dbUser = await prismaClient.user.findUnique({
		where: { id: user.id },
		select: { role: true }
	});
	return dbUser !== null && roles.includes(dbUser.role as Role);
}

export type RoleGuardResult<R extends Role> =
	| { ok: true; user: { id: string; email: string; name: string; role: R } }
	| { ok: false; failure: ActionFailure<ResultInfoData> };

/**
 * Guards a form action: 401 when nobody is signed in, 403 when the DB role is not in `roles`.
 * On success returns the signed-in user with the narrowed role, so callers can use it
 * (e.g. as `createdBy`) instead of trusting form input.
 *
 * Usage: `const access = await requireRole(event, ['ADMIN']); if (!access.ok) return access.failure;`
 */
export async function requireRole<const R extends Role>(
	{ request }: { request: Request },
	roles: readonly R[]
): Promise<RoleGuardResult<R>> {
	const unauthorized = (): RoleGuardResult<R> => ({
		ok: false,
		failure: fail(401, {
			success: false,
			message: 'Unauthorized',
			error: 'You must be signed in.'
		})
	});

	const { user } = await getUserServer({ request });
	if (!user) return unauthorized();

	const dbUser = await prismaClient.user.findUnique({
		where: { id: user.id },
		select: { id: true, email: true, name: true, role: true }
	});
	if (!dbUser) return unauthorized();

	const isAllowed = (role: string): role is R => (roles as readonly string[]).includes(role);
	if (!isAllowed(dbUser.role)) {
		return {
			ok: false,
			failure: fail(403, {
				success: false,
				message: 'Forbidden',
				error: 'You do not have permission.'
			})
		};
	}

	return { ok: true, user: { ...dbUser, role: dbUser.role } };
}

export async function writeToLogger({
	request,
	action,
	entityType,
	entityId
}: {
	request: Request;
	action: LoggerActionType;
	entityType: LoggerEntityType;
	entityId?: number | undefined;
}) {
	const { user } = await getUserServer({ request });

	try {
		if (user) {
			await prismaClient.activityLogs.create({
				data: {
					userId: user.id,
					action: action as LoggerActionType,
					entityType: entityType as LoggerEntityType,
					entityId: entityId
				}
			});
		} else {
			await prismaClient.activityLogs.create({
				data: {
					userId: 'Operator',
					action: action as LoggerActionType,
					entityType: entityType as LoggerEntityType,
					entityId: entityId
				}
			});
		}
	} catch (error: any) {
		return {
			success: false,
			message: `Something is wrong :( Please try again later.`,
			error: error.message + ' ' + error.code || 'Unknown error'
		};
	}
}

export interface MatchResult {
	isMatch: boolean;
	serialNumber?: string;
}

// Opt-in flag: a mask containing this token requires a side code anywhere in the DMC.
// The token itself is removed from the mask before matching.
const SIDE_TOKEN_REGEX = /\{SIDE\}/gi;
const SIDE_CODE_REGEX = /FR|FL|RR|RL/i;

export function matchDmcWithMask(scannedDmc: string, mask: string): MatchResult {
	const cleanDmc = scannedDmc.trim();
	const requiresSide = /\{SIDE\}/i.test(mask);
	const cleanMask = mask.replace(SIDE_TOKEN_REGEX, '').trim();

	if (requiresSide && !SIDE_CODE_REGEX.test(cleanDmc)) {
		return { isMatch: false };
	}

	if (!cleanMask.includes('*')) {
		return {
			isMatch: cleanDmc.toLowerCase() === cleanMask.toLowerCase()
		};
	}

	// 1. Escapneme špeciálne regex znaky (. + ? ^ $ atď.) okrem hviezdičky
	const escaped = cleanMask.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

	// 2. Nahradíme hviezdičky skupinou pre alfanumerické znaky:
	// ******** -> ([A-Za-z0-9]{8})
	// const regexPattern = escaped.replace(/\*+/g, (match) => `([A-Za-z0-9]{${match.length}})`);
	const regexPattern = escaped.replace(/\*+/g, '([A-Za-z0-9]+)');

	const regex = new RegExp(`^${regexPattern}$`, 'i');
	const match = cleanDmc.match(regex);

	if (!match) {
		return { isMatch: false };
	}

	return {
		isMatch: true,
		serialNumber: match[1] // vytiahnuté pohyblivé číslo (napr. 33020230)
	};
}
