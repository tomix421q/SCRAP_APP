import type { ActionData } from '../$types';

export type ScrapMode = 'rebuild' | 'scrap';
type ScanSuccess = Extract<ActionData, { data: any }>;
type MatchData = NonNullable<ScanSuccess['data']>['match'];
type Group = MatchData['groups'][number];

export interface ScanInitPayload {
	label: string;
	match: MatchData;
}
export interface ScrapRowState {
	label: string;
	groupId: number;
	groupName: string;
	qadIdentifySymbol: string;
	isRebuildGroup: boolean;
	selectedScrapId: number | undefined;
	selectedScrapCode: string;
	selectedScrapName: string;
	isOtherVariant: boolean;
	replacementPartId?: string;
	isOtherComponent: boolean;
}

export class ScrapManager {
	mode = $state<ScrapMode | null>(null);
	scrapPayload = $state<ScrapRowState[]>([]);
	scanData = $state<MatchData | null>(null);
	barcode = $state('');

	init(scanDataPayload: any, barcode: string) {
		// console.log(scanDataPayload);
		this.scanData = scanDataPayload.data.match;
		this.barcode = barcode;
		this.mode = null;

		if (this.scanData?.groups) {
			this.scrapPayload = this.scanData.groups.map((g: Group) => ({
				label: scanDataPayload.data.label,
				groupId: g.id,
				groupName: g.name,
				qadIdentifySymbol: g.qadIdentity ?? '',
				isRebuildGroup: g.isRebuild,
				selectedScrapId: undefined,
				selectedScrapCode: '',
				selectedScrapName: '',
				isOtherVariant: false,
				isOtherComponent: false,
				replacementPartId: ''
			}));
		} else {
			this.scrapPayload = [];
		}
	}

	selectScrap(groupId: number, scrapId: number) {
		const scrapRow = this.scrapPayload?.find((s) => s.groupId === groupId);
		const groupDef = this.scanData?.groups.find((g: any) => g.id === groupId);
		if (!scrapRow || !groupDef) return;

		const scrapDef = groupDef?.scrapCodes.find((s: any) => s.id === scrapId);
		if (!scrapDef) {
			scrapRow.selectedScrapCode = '';
			scrapRow.selectedScrapId = undefined;
			scrapRow.selectedScrapName = '';
			scrapRow.isOtherVariant = false;
			scrapRow.replacementPartId = '';

			this.syncRebuildBigComponents();
			return;
		}

		scrapRow.selectedScrapId = scrapDef.id;
		scrapRow.selectedScrapCode = scrapDef.code;
		scrapRow.selectedScrapName = scrapDef.name;

		// other variant scrap select
		const sName = scrapDef.name.toLowerCase();
		scrapRow.isOtherVariant = sName.includes('iny variant') || sName.includes('iný variant');
		scrapRow.replacementPartId = scrapRow.isOtherVariant ? 'empty' : '';

		if (this.mode === 'rebuild' && scrapRow.isRebuildGroup) {
			for (const other of this.scrapPayload) {
				if (other.isRebuildGroup && other.groupId !== groupId) {
					other.selectedScrapId = undefined;
				}
			}
		}
		this.syncRebuildBigComponents();
	}

	// Select mode rebuild/scrap
	setMode(newMode: ScrapMode) {
		this.mode = newMode;
		for (const s of this.scrapPayload!) {
			s.selectedScrapId = undefined;
			s.selectedScrapCode = '';
			s.selectedScrapName = '';
			s.isOtherVariant = false;
			s.replacementPartId = '';
			s.isOtherComponent = false;
		}
	}

	// Other variant selected PN
	setReplacementPart(groupId: number, partId: string) {
		const scrapRow = this.scrapPayload.find((s) => s.groupId === groupId);
		if (scrapRow) {
			scrapRow.replacementPartId = partId;
		}
	}

	// Checkbox other component
	setOtherComponent(groupId: number, value: boolean) {
		const row = this.scrapPayload.find((s) => s.groupId === groupId);
		if (!row) return;

		row.isOtherComponent = value;

		if (value) {
			row.selectedScrapId = undefined;
			row.selectedScrapCode = '';
			row.selectedScrapName = '';
			row.isOtherVariant = false;
			row.replacementPartId = '';
		}
	}

	// Sync
	private syncRebuildBigComponents() {
		if (this.mode !== 'rebuild' || !this.scrapPayload) return;

		// is rebuild && selected scrap
		const activeBigGroup = this.scrapPayload.find(
			(g) => g.isRebuildGroup && g.selectedScrapId !== undefined
		);

		//  not rebuild && selected scrap
		const hasSelectedSmall = this.scrapPayload.some(
			(g) => !g.isRebuildGroup && g.selectedScrapId !== undefined
		);

		if (activeBigGroup) {
			activeBigGroup.isOtherComponent = false;
			for (const row of this.scrapPayload) {
				if (row.isRebuildGroup && row.groupId !== activeBigGroup.groupId) {
					row.selectedScrapId = undefined;
					row.selectedScrapCode = '';
					row.selectedScrapName = '';
					row.isOtherVariant = false;
					row.replacementPartId = '';
					row.isOtherComponent = true;
				}
			}
		} else if (hasSelectedSmall) {
			for (const row of this.scrapPayload) {
				if (row.isRebuildGroup) {
					row.selectedScrapId = undefined;
					row.selectedScrapCode = '';
					row.selectedScrapName = '';
					row.isOtherVariant = false;
					row.replacementPartId = '';
					row.isOtherComponent = true;
				}
			}
		} else {
			for (const row of this.scrapPayload) {
				if (row.isRebuildGroup) {
					row.isOtherComponent = false;
				}
			}
		}
	}

	// Future payload only selected scraps
	relevantPayload = $derived.by(() => {
		return this.scrapPayload.filter((row) => {
			if (row.selectedScrapId) {
				return true;
			}
			if (row.isRebuildGroup && row.isOtherComponent) {
				return true;
			}

			return false;
		});
	});

	// Is any selected?
	hasAnySelection = $derived(this.scrapPayload?.some((s) => s.selectedScrapId));
	// Is selected other variant ?
	isMissingOtherVariantPN = $derived(
		this.scrapPayload?.some(
			(o) => o.isOtherVariant && (!o.replacementPartId || o.replacementPartId === 'empty')
		)
	);
	// Can submit?
	canSubmit = $derived(
		this.mode !== null &&
			this.hasAnySelection &&
			this.relevantPayload.length > 0 &&
			!this.isMissingOtherVariantPN
	);

	// Clear row
	clearScrapRow(groupId: number) {
		const row = this.scrapPayload.find((s) => s.groupId === groupId);
		if (!row) return;

		row.selectedScrapId = undefined;
		row.selectedScrapCode = '';
		row.selectedScrapName = '';
		row.isOtherVariant = false;
		row.replacementPartId = '';
		row.isOtherComponent = false;
		this.syncRebuildBigComponents();
	}

	// Clear all
	reset() {
		this.mode = null;
		this.scrapPayload = [];
		this.scanData = null;
		this.barcode = '';
	}
}
