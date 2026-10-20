import type { Prisma } from '@prisma/client';

export type ScrapMode = 'rebuild' | 'scrap';
type MatchData = Prisma.LabelGroupGetPayload<{
	include: {
		groups: {
			include: {
				materials: true;
				scrapCodes: true;
			};
		};
	};
}>;

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
	replacementPartMaterial?: string;
	isOtherComponent: boolean;
}

export class ScrapManager {
	mode = $state<ScrapMode | null>(null);
	scrapPayload = $state<ScrapRowState[]>([]);
	scanData = $state<MatchData | null>(null);
	barcode = $state('');

	init(scanDataPayload: ScanInitPayload, barcode: string) {
		this.scanData = scanDataPayload.match;
		this.barcode = barcode;
		this.mode = null;

		if (this.scanData?.groups) {
			this.scrapPayload = this.scanData.groups.map((g) => ({
				label: scanDataPayload.label,
				groupId: g.id,
				groupName: g.name,
				qadIdentifySymbol: g.qadIdentity ?? '',
				isRebuildGroup: g.isRebuild,
				selectedScrapId: undefined,
				selectedScrapCode: '',
				selectedScrapName: '',
				isOtherVariant: false,
				isOtherComponent: false,
				replacementPartMaterial: ''
			}));
		} else {
			this.scrapPayload = [];
		}
	}

	selectScrap(groupId: number, scrapId: number) {
		const scrapRow = this.scrapPayload?.find((s) => s.groupId === groupId);
		const groupDef = this.scanData?.groups.find((g) => g.id === groupId);
		if (!scrapRow || !groupDef) return;

		const scrapDef = groupDef.scrapCodes.find((s) => s.id === scrapId);
		if (!scrapDef) {
			scrapRow.selectedScrapCode = '';
			scrapRow.selectedScrapId = undefined;
			scrapRow.selectedScrapName = '';
			scrapRow.isOtherVariant = false;
			scrapRow.replacementPartMaterial = '';

			this.syncRebuildBigComponents();
			return;
		}

		scrapRow.selectedScrapId = scrapDef.id;
		scrapRow.selectedScrapCode = scrapDef.code;
		scrapRow.selectedScrapName = scrapDef.name;

		// other variant scrap select
		const sName = scrapDef.name.toLowerCase();
		scrapRow.isOtherVariant = sName.includes('iny variant') || sName.includes('iný variant');
		scrapRow.replacementPartMaterial = scrapRow.isOtherVariant ? 'empty' : '';

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
			s.replacementPartMaterial = '';
			s.isOtherComponent = false;
		}
	}

	// Other variant selected PN
	setReplacementPart(groupId: number, material: string) {
		const scrapRow = this.scrapPayload.find((s) => s.groupId === groupId);
		if (scrapRow) {
			scrapRow.replacementPartMaterial = material;
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
			row.replacementPartMaterial = '';
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
					row.replacementPartMaterial = '';
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
					row.replacementPartMaterial = '';
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
			(o) =>
				o.isOtherVariant && (!o.replacementPartMaterial || o.replacementPartMaterial === 'empty')
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
		row.replacementPartMaterial = '';
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
