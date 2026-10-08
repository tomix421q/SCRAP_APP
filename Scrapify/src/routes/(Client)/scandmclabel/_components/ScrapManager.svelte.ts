import z from 'zod';
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
	mode = $state<ScrapMode | null>();
	scrapPayload = $state<ScrapRowState[]>();
	scanData = $state<MatchData>();
	barcode = $state('');

	hasAnySelection = $derived(this.scrapPayload?.some((s) => s.selectedScrapId));

	isMissingOtherVariantPN = $derived(
		this.scrapPayload?.some(
			(o) => o.isOtherVariant && (!o.replacementPartId || o.replacementPartId === 'empty')
		)
	);

	canSubmit = $derived(this.mode !== null && this.hasAnySelection && !this.isMissingOtherVariantPN);

	init(scanDataCB: ScanSuccess, barcode: string) {
		this.scanData = scanDataCB.data.match;
		this.barcode = barcode;
		this.mode = null;

		if (scanDataCB.data && scanDataCB.success) {
			this.scrapPayload = scanDataCB.data.match.groups.map((g: Group) => ({
				label: scanDataCB.data.label!,
				groupId: g.id,
				groupName: g.name,
				quadIdentifySymbol: '-',
				isRebuildGroup: g.isRebuild,
				mode: null,
				selectedScrapId: undefined,
				selectedScrapCode: '',
				selectedScrapName: '',
				isOtherVariant: false,
				isOtherComponent: false
			}));
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
		}
	}

	selectScrap(groupId: number, scrapId: number, scrapName: string) {
		const scrapRow = this.scrapPayload?.find((s) => s.groupId === groupId);
		if (!scrapRow) return;

		scrapRow.selectedScrapId = scrapId;
		const groupDef = this.scanData?.groups.find((g: any) => g.id === groupId);
		const scrapDef = groupDef?.scrapCodes.find((s: any) => s.id === scrapId);
		if (!scrapDef) {
			scrapRow.selectedScrapCode = '';
			scrapRow.selectedScrapId = undefined;
			scrapRow.selectedScrapName = '';

			if (this.mode === 'rebuild' && scrapRow.isRebuildGroup) {
				this.clearOtherRebuildBigGroups(groupId);
			}
			return;
		}

		const sName = scrapDef.name.toLowerCase();
		scrapRow.isOtherVariant = sName.includes('iny variant') || sName.includes('iný variant');
		scrapRow.replacementPartId = scrapRow.isOtherVariant ? 'empty' : 'empty';

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

	private clearOtherRebuildBigGroups(triggerGroupId: number) {
		if (this.scrapPayload) {
			for (const otherGroup of this.scrapPayload) {
				if (otherGroup.isRebuildGroup && otherGroup.groupId !== triggerGroupId) {
					otherGroup.selectedScrapId = undefined;
					otherGroup.selectedScrapCode = '';
					otherGroup.selectedScrapName = '';
					otherGroup.isOtherVariant = false;
					otherGroup.replacementPartId = '';
				}
			}
		}
	}
}
