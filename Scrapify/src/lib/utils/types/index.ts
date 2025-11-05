import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';
import type { Prisma } from '@prisma/client';

export const ROLES = ['USER', 'ENGINEER', 'MODERATOR', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export type PartSide = 'FRONT-LEFT' | 'FRONT-RIGHT' | 'REAR-LEFT' | 'REAR-RIGHT';

export const PART_SIDES: { id: PartSide; name: string }[] = [
	{ id: 'FRONT-LEFT', name: 'Front Left' },
	{ id: 'FRONT-RIGHT', name: 'Front Right' },
	{ id: 'REAR-LEFT', name: 'Rear Left' },
	{ id: 'REAR-RIGHT', name: 'Rear Right' }
];

export interface FilterType {
	partNumber: string;
	partId: string;
	scrapCode: string;
	processName: string;
	dateFrom: string;
	dateTo: string;
}

export interface DataAndResultData<T> extends ResultInfoData {
	data: T[];
	totalPages: number;
}

export type LoggerActionType =
	| 'CREATE'
	| 'EDIT'
	| 'DELETE'
	| 'LOGIN'
	| 'LOGOUT'
	| 'VIEW'
	| 'EXPORT'
	| 'ASSIGN';

export type LoggerEntityType =
	| 'Hall'
	| 'Part'
	| 'Process'
	| 'Project'
	| 'ScrapCode'
	| 'Operator'
	| 'User'
	| 'ScrapRecord';

//in create scrap form,
// type ProcessWithRelationsPayload = Prisma.ProcessGetPayload<{
// 	include: {
// 		project: {
// 			include: {
// 				project: {
// 					include: {
// 						hall: {
// 							select: {
// 								name: true;
// 							};
// 						};
// 					};
// 				};
// 			};
// 		};
// 	};
// }>;
// export type ProcessWithRelations = ProcessWithRelationsPayload;

export type PartWithRelation = Prisma.PartGetPayload<{
	include: {
		process: { include: { hall: true } };
		project: true;
	};
}>;

export type ProcessWithRelations = Prisma.ProcessGetPayload<{
	include: {
		hall: true;
	};
}>;
export type ProcessWithRelationsAll = Prisma.ProcessGetPayload<{
	include: {
		project: { include: { project: true } };
		parts: { include: { process: true } };
		hall: true;
	};
}>;

export type ScrapRecordWithRelations = Prisma.ScrapRecordGetPayload<{
	include: { part: { include: { process: true } }; scrapCode: true };
}>;
