import { auth } from '@/auth/auth';
import prismaClient from '@/server/prisma';
import type { LoggerActionType, LoggerEntityType } from './types';

export async function getUserServer({ request }: { request: Request }) {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	return { user: session?.user ?? null, session: session?.session ?? null };
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

export function matchDmcWithMask(scannedDmc: string, mask: string): MatchResult {
	const cleanDmc = scannedDmc.trim();
	const cleanMask = mask.trim();

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
