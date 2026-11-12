import prismaClient from '@/server/prisma';
import { dateTimePartsLocalTimeDb, getLocalDateTimeForDb } from '@/utils/index';
import { scrapRecordType } from '../../../scrapRecords/columns';
import { operatorHistoryLimit, type OperatorHistory } from './history';

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

	return {
		limitReached: records.length > operatorHistoryLimit,
		entries: records.slice(0, operatorHistoryLimit).map((record) => ({
			id: record.id,
			// The DB time formatter yields HH:mm:ss; the history shows minutes only.
			time: dateTimePartsLocalTimeDb(record.createdAt).time.slice(0, 5),
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
		}))
	};
}
