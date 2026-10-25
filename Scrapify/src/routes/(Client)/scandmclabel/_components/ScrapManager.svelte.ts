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
	interfaceName: string;
	qadIdentifySymbol: string;
	isRebuildGroup: boolean;
	selectedScrapCode: string | null;
	selectedScrapDescription: string | null;
	isOtherVariant: boolean;
	replacementPartMaterial: string | null;
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
				interfaceName: g.interfaceName,
				qadIdentifySymbol: g.qadIdentity ?? '',
				isRebuildGroup: g.isRebuild,
				selectedScrapCode: null,
				selectedScrapDescription: null,
				isOtherVariant: false,
				isOtherComponent: false,
				replacementPartMaterial: ''
			}));
		} else {
			this.scrapPayload = [];
		}
	}

	selectScrap(groupId: number, scrapCode: string) {
		const scrapRow = this.scrapPayload?.find((s) => s.groupId === groupId);
		const groupDef = this.scanData?.groups.find((g) => g.id === groupId);
		if (!scrapRow || !groupDef) return;

		const scrapDef = groupDef.scrapCodes.find((s) => s.code === scrapCode);
		if (!scrapDef) {
			scrapRow.selectedScrapCode = '';
			scrapRow.selectedScrapDescription = '';
			scrapRow.isOtherVariant = false;
			scrapRow.replacementPartMaterial = '';

			this.syncRebuildBigComponents();
			return;
		}

		scrapRow.selectedScrapCode = scrapDef.code;
		scrapRow.selectedScrapDescription = scrapDef.description ?? '';
		scrapRow.isOtherVariant = false;
		scrapRow.replacementPartMaterial = '';

		if (this.mode === 'rebuild' && scrapRow.isRebuildGroup) {
			for (const other of this.scrapPayload) {
				if (other.isRebuildGroup && other.groupId !== groupId) {
					other.selectedScrapCode = null;
				}
			}
		}
		this.syncRebuildBigComponents();
	}

	// Select mode rebuild/scrap
	setMode(newMode: ScrapMode) {
		this.mode = newMode;
		for (const s of this.scrapPayload!) {
			s.selectedScrapCode = null;
			s.selectedScrapDescription = null;
			s.isOtherVariant = false;
			s.replacementPartMaterial = null;
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

	setOtherVariant(groupId: number, value: boolean) {
		const row = this.scrapPayload.find((s) => s.groupId === groupId);
		if (!row) return;

		row.isOtherVariant = value;
		row.replacementPartMaterial = value ? 'empty' : '';

		if (value) {
			row.selectedScrapCode = null;
			row.selectedScrapDescription = null;
			row.isOtherComponent = false;
		}

		this.syncRebuildBigComponents();
	}

	// Checkbox other component
	setOtherComponent(groupId: number, value: boolean) {
		const row = this.scrapPayload.find((s) => s.groupId === groupId);
		if (!row) return;

		row.isOtherComponent = value;

		if (value) {
			row.selectedScrapCode = null;
			row.selectedScrapDescription = null;
			row.isOtherVariant = false;
			row.replacementPartMaterial = null;
		}
	}

	// Sync
	private syncRebuildBigComponents() {
		if (this.mode !== 'rebuild' || !this.scrapPayload) return;

		// is rebuild && selected scrap
		const activeBigGroup = this.scrapPayload.find(
			(g) => g.isRebuildGroup && (Boolean(g.selectedScrapCode) || g.isOtherVariant)
		);

		//  not rebuild && selected scrap
		const hasSelectedSmall = this.scrapPayload.some(
			(g) => !g.isRebuildGroup && (Boolean(g.selectedScrapCode) || g.isOtherVariant)
		);

		if (activeBigGroup) {
			activeBigGroup.isOtherComponent = false;
			for (const row of this.scrapPayload) {
				if (row.isRebuildGroup && row.groupId !== activeBigGroup.groupId) {
					row.selectedScrapCode = '';
					row.selectedScrapDescription = '';
					row.isOtherVariant = false;
					row.replacementPartMaterial = '';
					row.isOtherComponent = true;
				}
			}
		} else if (hasSelectedSmall) {
			for (const row of this.scrapPayload) {
				if (row.isRebuildGroup) {
					row.selectedScrapCode = null;
					row.selectedScrapDescription = null;
					row.isOtherVariant = false;
					row.replacementPartMaterial = null;
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
			if (row.selectedScrapCode) {
				return true;
			}
			if (row.isOtherComponent) {
				return true;
			}
			if (row.isOtherVariant) {
				return true;
			}
			return false;
		});
	});

	// Is any selected?
	hasAnySelection = $derived(
		this.scrapPayload?.some((s) => Boolean(s.selectedScrapCode) || s.isOtherVariant)
	);
	// Is selected other variant ?
	isMissingOtherVariantPN = $derived(
		this.scrapPayload?.some(
			(o) =>
				o.isOtherVariant &&
				(!o.replacementPartMaterial ||
					o.replacementPartMaterial.trim() === '' ||
					o.replacementPartMaterial === 'empty')
		)
	);
	isMissingOtherComponentScrap = $derived(
		this.mode === 'scrap' &&
			this.scrapPayload.some(
				(row) =>
					row.isOtherComponent &&
					!this.scrapPayload.some(
						(other) =>
							other.groupId !== row.groupId &&
							(Boolean(other.selectedScrapCode) || other.isOtherVariant)
					)
			)
	);
	// Can submit?
	canSubmit = $derived(
		this.mode !== null &&
			this.hasAnySelection &&
			this.relevantPayload.length > 0 &&
			!this.isMissingOtherVariantPN &&
			!this.isMissingOtherComponentScrap
	);

	// Clear row
	clearScrapRow(groupId: number) {
		const row = this.scrapPayload.find((s) => s.groupId === groupId);
		if (!row) return;

		row.selectedScrapCode = null;
		row.selectedScrapDescription = null;
		row.isOtherVariant = false;
		row.replacementPartMaterial = null;
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
