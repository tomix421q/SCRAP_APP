import type { Prisma } from '@prisma/client';
import {
	getHiddenReason,
	extractSideFromDmc,
	type ScanMode
} from '@/utils/partGroupVisibility';

export type ScrapMode = 'rebuild' | 'scrap' | 'qntScrap';
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

/** Rebuild already saved under the scanned DMC (formatted local DB time, operator card ID). */
export interface ExistingRebuild {
	createdAt: string;
	createdBy: string;
}

export interface ScanInitPayload {
	label: string;
	match: MatchData;
	existingRebuild?: ExistingRebuild | null;
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
	quantity?: number;
	isOtherVariant: boolean;
	replacementPartMaterial: string | null;
	isOtherComponent: boolean;
	/** Part group whose Other component scrap code this row gets; set only with `isOtherComponent`. */
	otherComponentCauseGroupId: number | null;
}

export class ScrapManager {
	mode = $state<ScrapMode | null>(null);
	scrapPayload = $state<ScrapRowState[]>([]);
	scanData = $state<MatchData | null>(null);
	barcode = $state('');
	existingRebuild = $state<ExistingRebuild | null>(null);
	// Main reason group the rebuild rows were last auto-marked for; re-marking only happens when it changes,
	// so a row the operator unmarked stays unmarked while the main reason group stays the same.
	private rebuildCauseGroupId: number | null = null;

	init(scanDataPayload: ScanInitPayload, barcode: string) {
		this.scanData = scanDataPayload.match;
		this.barcode = barcode;
		this.existingRebuild = scanDataPayload.existingRebuild ?? null;
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
				quantity: undefined,
				isOtherVariant: false,
				isOtherComponent: false,
				otherComponentCauseGroupId: null,
				replacementPartMaterial: ''
			}));
		} else {
			this.scrapPayload = [];
		}
	}

	/** Rebuild group the engineer flagged as unable to be the main reason (it has no reason to pick). */
	cannotBeMainReason(groupId: number) {
		return (
			this.mode === 'rebuild' &&
			Boolean(this.scanData?.groups.find((g) => g.id === groupId)?.cannotBeMainReason)
		);
	}

	selectScrap(groupId: number, scrapCode: string) {
		if (this.cannotBeMainReason(groupId)) return;
		const scrapRow = this.scrapPayload?.find((s) => s.groupId === groupId);
		const groupDef = this.scanData?.groups.find((g) => g.id === groupId);
		if (!scrapRow || !groupDef) return;

		const scrapDef = groupDef.scrapCodes.find((s) => s.code === scrapCode);
		if (!scrapDef) {
			scrapRow.selectedScrapCode = '';
			scrapRow.selectedScrapDescription = '';
			scrapRow.isOtherVariant = false;
			scrapRow.replacementPartMaterial = '';

			this.syncOtherComponents();
			return;
		}

		scrapRow.selectedScrapCode = scrapDef.code;
		scrapRow.selectedScrapDescription = scrapDef.description ?? '';
		if (this.mode !== 'qntScrap') {
			scrapRow.isOtherVariant = false;
			scrapRow.replacementPartMaterial = '';
		}

		if (this.mode === 'rebuild' && scrapRow.isRebuildGroup) {
			for (const other of this.scrapPayload) {
				if (other.isRebuildGroup && other.groupId !== groupId) {
					other.selectedScrapCode = null;
				}
			}
		}
		this.syncOtherComponents();
	}

	// Select mode rebuild/scrap
	setMode(newMode: ScrapMode) {
		// A DMC can be rebuilt only once.
		if (newMode === 'rebuild' && this.existingRebuild) return;
		this.mode = newMode;
		this.rebuildCauseGroupId = null;
		for (const s of this.scrapPayload!) {
			s.selectedScrapCode = null;
			s.selectedScrapDescription = null;
			s.quantity = undefined;
			s.isOtherVariant = false;
			s.replacementPartMaterial = null;
			s.isOtherComponent = false;
			s.otherComponentCauseGroupId = null;
			s.quantity = 0;
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
		if (value && this.cannotBeMainReason(groupId)) return;
		const row = this.scrapPayload.find((s) => s.groupId === groupId);
		if (!row) return;

		row.isOtherVariant = value;
		row.replacementPartMaterial = value ? 'empty' : '';

		if (value) {
			row.selectedScrapCode = null;
			row.selectedScrapDescription = null;
			row.isOtherComponent = false;
			row.otherComponentCauseGroupId = null;
		}

		this.syncOtherComponents();
	}

	// Checkbox other component
	setOtherComponent(groupId: number, value: boolean) {
		const row = this.scrapPayload.find((s) => s.groupId === groupId);
		if (!row) return;
		const candidates = this.causeCandidates(groupId);
		if (value && candidates.length === 0) return;

		row.isOtherComponent = value;
		// A single candidate is the obvious cause; with more the operator picks one.
		row.otherComponentCauseGroupId =
			value && candidates.length === 1 ? candidates[0].groupId : null;

		if (value) {
			row.selectedScrapCode = null;
			row.selectedScrapDescription = null;
			row.isOtherVariant = false;
			row.replacementPartMaterial = null;
		}
		// The row may have been the cause of other rows.
		this.syncOtherComponents();
	}

	setOtherComponentCause(groupId: number, causeGroupId: number) {
		const row = this.scrapPayload.find((s) => s.groupId === groupId);
		if (!row?.isOtherComponent) return;
		if (!this.causeCandidates(groupId).some((cause) => cause.groupId === causeGroupId)) return;
		row.otherComponentCauseGroupId = causeGroupId;
	}

	/** Other component scrap code of a part group, or undefined when the engineer has not set one. */
	otherComponentCodeOf(groupId: number) {
		return this.scanData?.groups
			.find((g) => g.id === groupId)
			?.scrapCodes.find((scrapCode) => scrapCode.isOtherComponent);
	}

	/** Rows the operator works with: part groups hidden by any visibility rule for this mode and DMC are left out. */
	visibleRows = $derived.by(() => {
		const mode = this.mode;
		if (mode === null) return this.scrapPayload;
		const ruleMode: ScanMode = mode === 'qntScrap' ? 'quantity' : mode;
		return this.scrapPayload.filter((row) => {
			const group = this.scanData?.groups.find((g) => g.id === row.groupId);
			return !group || !getHiddenReason(group, { mode: ruleMode, dmc: this.barcode });
		});
	});

	/** Message shown instead of the rebuild list when every part group is hidden; null otherwise. */
	emptyRebuildMessage = $derived.by(() => {
		if (this.mode !== 'rebuild' || this.visibleRows.length > 0) return null;
		const side = extractSideFromDmc(this.barcode);
		return side
			? `Pre stranu ${side} nie sú v rebuilde žiadne part groups.`
			: 'V rebuilde nie sú žiadne part groups.';
	});

	// Rows that can be the cause of other component rows.
	// Rebuild: the main reason group (its missing code is reported, not hidden).
	// Scrap: every group with a selected reason that has an Other component scrap code.
	private causeRows = $derived.by(() => {
		if (this.mode === 'rebuild') {
			const mainReasonRow = this.visibleRows.find(
				(row) => row.isRebuildGroup && Boolean(row.selectedScrapCode)
			);
			return mainReasonRow ? [mainReasonRow] : [];
		}
		if (this.mode === 'scrap') {
			return this.visibleRows.filter(
				(row) =>
					Boolean(row.selectedScrapCode) &&
					!row.isOtherVariant &&
					!row.isOtherComponent &&
					Boolean(this.otherComponentCodeOf(row.groupId))
			);
		}
		return [];
	});

	causeCandidates(groupId: number) {
		return this.causeRows.filter((row) => row.groupId !== groupId);
	}

	/** The "Iný komponent" checkbox is offered only when some other row can be the cause. */
	canMarkOtherComponent(groupId: number) {
		return this.causeCandidates(groupId).length > 0;
	}

	private hasValidCause(row: ScrapRowState) {
		return this.causeCandidates(row.groupId).some(
			(cause) => cause.groupId === row.otherComponentCauseGroupId
		);
	}

	// Sync after every change of reasons: rebuild auto-marking, then drop rows whose cause is gone.
	private syncOtherComponents() {
		this.syncRebuildBigComponents();
		for (const row of this.visibleRows) {
			if (!row.isOtherComponent) continue;
			const candidates = this.causeCandidates(row.groupId);
			// A row still waiting for the operator's choice keeps waiting while candidates exist.
			if (row.otherComponentCauseGroupId === null && candidates.length > 1) continue;
			if (row.otherComponentCauseGroupId === null && candidates.length === 1) {
				row.otherComponentCauseGroupId = candidates[0].groupId;
				continue;
			}
			if (this.hasValidCause(row)) continue;
			row.isOtherComponent = false;
			row.otherComponentCauseGroupId = null;
		}
	}

	private syncRebuildBigComponents() {
		if (this.mode !== 'rebuild') return;

		// Only one rebuild group may carry a reason or another variant.
		const activeBigGroup = this.visibleRows.find(
			(g) => g.isRebuildGroup && (Boolean(g.selectedScrapCode) || g.isOtherVariant)
		);

		if (activeBigGroup) {
			activeBigGroup.isOtherComponent = false;
			activeBigGroup.otherComponentCauseGroupId = null;
			for (const row of this.visibleRows) {
				if (row.isRebuildGroup && row.groupId !== activeBigGroup.groupId) {
					row.selectedScrapCode = '';
					row.selectedScrapDescription = '';
					row.isOtherVariant = false;
					row.replacementPartMaterial = '';
				}
			}
		}

		// Another variant is not a main reason, so it causes nothing.
		const causeGroupId = activeBigGroup?.selectedScrapCode ? activeBigGroup.groupId : null;
		if (causeGroupId !== null && causeGroupId !== this.rebuildCauseGroupId) {
			for (const row of this.visibleRows) {
				if (row.isRebuildGroup && row.groupId !== causeGroupId) {
					row.isOtherComponent = true;
					row.otherComponentCauseGroupId = causeGroupId;
				}
			}
		}
		this.rebuildCauseGroupId = causeGroupId;
	}

	// Quantity scrap row state: "started" = any field touched, "complete" = all three filled
	private hasQntQuantity(row: ScrapRowState) {
		return typeof row.quantity === 'number' && Number.isInteger(row.quantity) && row.quantity > 0;
	}
	private hasQntPart(row: ScrapRowState) {
		return Boolean(row.replacementPartMaterial) && row.replacementPartMaterial !== 'empty';
	}
	isQntRowComplete(row: ScrapRowState) {
		return this.hasQntQuantity(row) && this.hasQntPart(row) && Boolean(row.selectedScrapCode);
	}
	isQntRowStarted(row: ScrapRowState) {
		return this.hasQntQuantity(row) || this.hasQntPart(row) || Boolean(row.selectedScrapCode);
	}
	hasIncompleteQntRow = $derived(
		this.mode === 'qntScrap' &&
			this.visibleRows.some((row) => this.isQntRowStarted(row) && !this.isQntRowComplete(row))
	);

	// Future payload only selected scraps
	relevantPayload = $derived.by(() => {
		return this.visibleRows.filter((row) => {
			if (this.mode === 'qntScrap') {
				return this.isQntRowComplete(row);
			}
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
		this.visibleRows.some((s) => Boolean(s.selectedScrapCode) || s.isOtherVariant)
	);
	// Is selected other variant ?
	isMissingOtherVariantPN = $derived(
		this.visibleRows.some(
			(o) =>
				o.isOtherVariant &&
				(!o.replacementPartMaterial ||
					o.replacementPartMaterial.trim() === '' ||
					o.replacementPartMaterial === 'empty')
		)
	);
	// Every other component row needs a valid cause (rebuild: the main reason group; scrap: the chosen one).
	isMissingOtherComponentCause = $derived(
		this.visibleRows.some((row) => row.isOtherComponent && !this.hasValidCause(row))
	);
	// Causes without an Other component scrap code would make dependent rows save without a code.
	causeGroupIdsWithoutCode = $derived.by(() => {
		const ids = new Set<number>();
		for (const row of this.visibleRows) {
			const causeId = row.otherComponentCauseGroupId;
			if (row.isOtherComponent && causeId !== null && !this.otherComponentCodeOf(causeId)) {
				ids.add(causeId);
			}
		}
		return [...ids];
	});
	// Can submit?
	canSubmit = $derived(
		this.mode === 'qntScrap'
			? this.relevantPayload.length > 0 && !this.hasIncompleteQntRow
			: this.mode !== null &&
					this.visibleRows.length > 0 &&
					this.hasAnySelection &&
					this.relevantPayload.length > 0 &&
					!this.isMissingOtherVariantPN &&
					!this.isMissingOtherComponentCause &&
					this.causeGroupIdsWithoutCode.length === 0
	);

	// Clear row
	clearScrapRow(groupId: number) {
		const row = this.scrapPayload.find((s) => s.groupId === groupId);
		if (!row) return;

		row.selectedScrapCode = null;
		row.selectedScrapDescription = null;
		// Quantity scrap keeps the selected part; it has its own clear button
		if (this.mode === 'qntScrap') return;
		row.isOtherVariant = false;
		row.replacementPartMaterial = null;
		row.isOtherComponent = false;
		row.otherComponentCauseGroupId = null;
		this.syncOtherComponents();
	}

	// Clear all
	reset() {
		this.mode = null;
		this.rebuildCauseGroupId = null;
		this.scrapPayload = [];
		this.scanData = null;
		this.barcode = '';
		this.existingRebuild = null;
	}
}
