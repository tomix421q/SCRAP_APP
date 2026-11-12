import prismaClient from '@/server/prisma';
import { dateTimePartsLocalTimeDb, getLocalDateTimeForDb } from '@/utils/index';
import { scrapRecordType } from '../../../scrapRecords/columns';
import {
	operatorHistoryLimit,
	type OperatorHistory,
	type OperatorHistoryEntry,
	type OperatorHistoryRecord
} from './history';

/**
 * Start of the current local calendar day in the DB representation
 * (local wall-clock time read as UTC, see `getLocalDateTimeForDb`).
 */
function startOfLocalDayForDb(now: Date = new Date()): Date {
	const localAsUtc = getLocalDateTimeForDb(now);
	localAsUtc.setUTCHours(0, 0, 0, 0);
	return localAsUtc;
}

/** Records the operator (identified by card ID) saved since local midnight, newest first. */
export async function loadOperatorHistory(cardId: string): Promise<OperatorHistory> {
	const records = await prismaClient.scrapRecord.findMany({
		where: { createdBy: cardId, createdAt: { gte: startOfLocalDayForDb() } },
		include: { partGroup: { select: { interfaceName: true } } },
		orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		// One extra row tells whether the list was actually cut off.
		take: operatorHistoryLimit + 1
	});

	const historyRecords = records
		.slice(0, operatorHistoryLimit)
		.map((record): OperatorHistoryRecord & { savedAt: number } => ({
			id: record.id,
			// The DB time formatter yields HH:mm:ss; the history shows minutes only.
			time: dateTimePartsLocalTimeDb(record.createdAt).time.slice(0, 5),
			savedAt: record.createdAt.getTime(),
			dmc: record.dmc,
			partGroupName: record.partGroup.interfaceName,
			// The mode is not stored, it is derived the same way as on `scrapRecords`.
			mode: scrapRecordType(record),
			scrapCode: record.scrapCode,
			scrapCodeDescription: record.scrapCodeDescription,
			isOtherComponent: record.isOtherComponent,
			// An empty string means no Other variant, as on `scrapRecords`.
			replacementPartMaterial: record.replacementPartMaterial?.trim() || null,
			quantity: record.quantity,
			qadExported: record.QADExported === true
		}));

	return {
		limitReached: records.length > operatorHistoryLimit,
		entries: groupRebuildSaves(historyRecords)
	};
}

/**
 * Collapses each rebuild save into one entry. Records of one save share the label and
 * `createdAt` (one `createMany`, `GETDATE()` evaluated once). Records with a reason
 * (scrap code or Other variant) stay visible, flag-only records go to `related`.
 */
function groupRebuildSaves(
	records: (OperatorHistoryRecord & { savedAt: number })[]
): OperatorHistoryEntry[] {
	const groups = new Map<string, OperatorHistoryRecord[]>();
	for (const { savedAt, ...record } of records) {
		const key =
			record.mode === 'Rebuild' ? `rebuild|${record.dmc}|${savedAt}` : `record|${record.id}`;
		const group = groups.get(key);
		if (group) group.push(record);
		else groups.set(key, [record]);
	}

	return [...groups.values()].map((group) => {
		const withReason = group.filter((record) => record.scrapCode || record.replacementPartMaterial);
		// A save without any reason still needs a record to show on top.
		const [main, ...otherReasons] = withReason.length > 0 ? withReason : group;
		return {
			...main,
			otherReasons,
			related: group.filter((record) => record !== main && !otherReasons.includes(record))
		};
	});
}
