import type { ScrapRecordType } from '../../../scrapRecords/columns';

/** Maximum number of records shown in the operator history. */
export const operatorHistoryLimit = 200;

export type OperatorHistoryMode = ScrapRecordType;

/** One saved scrap record as the operator sees it in the history dialog. */
export type OperatorHistoryRecord = {
	id: number;
	/** Local time of saving, HH:mm. */
	time: string;
	dmc: string;
	partGroupName: string;
	mode: OperatorHistoryMode;
	scrapCode: string | null;
	scrapCodeDescription: string | null;
	isOtherComponent: boolean;
	/** Part number of the replacement part (Other variant); null when none was chosen. */
	replacementPartMaterial: string | null;
	quantity: number;
	qadExported: boolean;
};

/**
 * One row of the history. A rebuild save writes one record per part group: groups with a
 * reason (scrap code or Other variant) and groups carrying only the flag. They are shown as
 * one row: the first record with a reason on top, further reasons in `otherReasons`, and
 * flag-only records in `related` (expandable). Other rows have both lists empty.
 */
export type OperatorHistoryEntry = OperatorHistoryRecord & {
	otherReasons: OperatorHistoryRecord[];
	related: OperatorHistoryRecord[];
};

export type OperatorHistory = {
	entries: OperatorHistoryEntry[];
	/** True when the list was cut at `operatorHistoryLimit`. */
	limitReached: boolean;
};
