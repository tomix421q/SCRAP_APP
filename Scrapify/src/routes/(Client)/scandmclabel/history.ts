import type { ScrapRecordType } from '../scrapRecords/columns';

/** Maximum number of records shown in the operator history. */
export const operatorHistoryLimit = 200;

export type OperatorHistoryMode = ScrapRecordType;

/** One saved scrap record as the operator sees it in the history dialog. */
export type OperatorHistoryEntry = {
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

export type OperatorHistory = {
	entries: OperatorHistoryEntry[];
	/** True when the list was cut at `operatorHistoryLimit`. */
	limitReached: boolean;
};
