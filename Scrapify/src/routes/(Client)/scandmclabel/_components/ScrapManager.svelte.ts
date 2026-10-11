import type { ActionData } from '../$types';

export type ScrapMode = 'rebuild' | 'scrap';
type ScanSuccess = Extract<ActionData, { data: any }>;
type MatchData = NonNullable<ScanSuccess['data']>['match'];
type Group = MatchData['groups'][number];

export interface ScrapRowState {
	label: string;
	groupId: number;
	groupName: string;
	quadIdentifySymbol: string;
	isRebuildGroup: boolean;
	mode: ScrapMode | null;
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

	hasAnySelection = $derived(this.scrapPayload?.some((s) => s.selectedScrapId));

	isMissingOtherVariantPN = $derived(
		this.scrapPayload?.some(
			(o) => o.isOtherVariant && (!o.replacementPartId || o.replacementPartId === 'empty')
		)
	);

	canSubmit = $derived(this.mode !== null && this.hasAnySelection && !this.isMissingOtherVariantPN);

	scrapCodesPayload = $derived.by(() => {
		const result: Record<string, string> = {};
		for (const row of this.scrapPayload!) {
			if (row.selectedScrapCode) {
				result[row.groupName] = row.selectedScrapCode;
			}
		}
		return result;
	});

	// ✅ Pripravený payload pre Other Variant { [groupName]: partNumber }
	otherVariantPayload = $derived.by(() => {
		const result: Record<string, string> = {};
		for (const row of this.scrapPayload!) {
			if (row.isOtherVariant && row.replacementPartId && row.replacementPartId !== 'empty') {
				const group = this.scanData?.groups.find((g) => g.id === row.groupId);
				const part = group?.parts.find((p) => p.id === Number(row.replacementPartId));
				if (part) {
					result[row.groupName] = part.partNumber;
				}
			}
		}
		return result;
	});

	init(scanDataCB: ScanSuccess, barcode: string) {
		this.scanData = scanDataCB.data.match ?? null;
		this.barcode = barcode;
		this.mode = null;

		if (this.scanData?.groups) {
			this.scrapPayload = this.scanData.groups.map((g: Group) => ({
				label: scanDataCB.data?.label ?? '',
				groupId: g.id,
				groupName: g.name,
				quadIdentifySymbol: (g as any).qadIdentity ?? '-',
				isRebuildGroup: g.isRebuild,
				selectedScrapId: undefined,
				selectedScrapCode: '',
				selectedScrapName: '',
				isOtherVariant: false,
				isOtherComponent: false,
				replacementPartId: '',
				mode: null
			}));
		} else {
			this.scrapPayload = [];
		}
	}

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

	selectScrap(groupId: number, scrapId: number) {
		const scrapRow = this.scrapPayload?.find((s) => s.groupId === groupId);
		if (!scrapRow) return;

		scrapRow.selectedScrapId = scrapId;
		const groupDef = this.scanData?.groups.find((g: any) => g.id === groupId);
		const scrapDef = groupDef?.scrapCodes.find((s: any) => s.id === scrapId);
		if (!scrapDef) {
			scrapRow.selectedScrapCode = '';
			scrapRow.selectedScrapId = undefined;
			scrapRow.selectedScrapName = '';
			scrapRow.isOtherVariant = false;
			scrapRow.replacementPartId = '';

			if (this.mode === 'rebuild' && scrapRow.isRebuildGroup) {
				this.clearOtherRebuildBigGroups(groupId);
			}
			return;
		}

		const sName = scrapDef.name.toLowerCase();
		scrapRow.isOtherVariant = sName.includes('iny variant') || sName.includes('iný variant');
		scrapRow.replacementPartId = scrapRow.isOtherVariant ? 'empty' : '';

		if (this.mode === 'rebuild' && scrapRow.isRebuildGroup && this.scrapPayload) {
			for (const otherGroup of this.scrapPayload) {
				if (otherGroup.isRebuildGroup && otherGroup.groupId !== groupId) {
					otherGroup.selectedScrapId = undefined;
					otherGroup.selectedScrapCode = '';
					otherGroup.selectedScrapName = '';
					otherGroup.isOtherVariant = false;
					otherGroup.replacementPartId = '';
					otherGroup.isOtherComponent = true;
				}
			}
		}
	}

	setReplacementPart(groupId: number, partId: string) {
		const scrapRow = this.scrapPayload.find((s) => s.groupId === groupId);
		if (scrapRow) {
			scrapRow.replacementPartId = partId;
		}
	}

	private clearOtherRebuildBigGroups(triggerGroupId: number) {
		if (this.scrapPayload) {
			for (const otherGroup of this.scrapPayload) {
				if (otherGroup.isRebuildGroup && otherGroup.groupId !== triggerGroupId) {
					otherGroup.selectedScrapId = undefined;
					otherGroup.selectedScrapCode = '';
					otherGroup.selectedScrapName = '';
					otherGroup.isOtherVariant = false;
					otherGroup.replacementPartId = '';
					otherGroup.isOtherComponent = false;
				}
			}
		}
	}

	reset() {
		this.mode = null;
		this.scrapPayload = [];
		this.scanData = null;
		this.barcode = '';
	}
}
