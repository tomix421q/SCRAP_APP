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
