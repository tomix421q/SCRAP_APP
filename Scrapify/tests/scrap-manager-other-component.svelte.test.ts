import { describe, expect, it } from 'vitest';
import {
	ScrapManager,
	type ScanInitPayload
} from '../src/routes/(Client)/scandmclabel/_components/ScrapManager.svelte';

const MAIN_CARRIER = 10;
const MIDDFIELD = 11;
const BELTLINE = 12;
const MA_POCKET = 13;

type GroupFixture = {
	id: number;
	name: string;
	isRebuild: boolean;
	otherCode?: string;
	cannotBeMainReason?: boolean;
	hiddenInScrap?: boolean;
};

function group({
	id,
	name,
	isRebuild,
	otherCode,
	cannotBeMainReason = false,
	hiddenInScrap = false
}: GroupFixture) {
	const scrapCodes = [
		{ id: id * 10, partGroupId: id, code: `R${id}`, description: 'Reason', isOtherComponent: false }
	];
	if (otherCode) {
		scrapCodes.push({
			id: id * 10 + 1,
			partGroupId: id,
			code: otherCode,
			description: 'Other',
			isOtherComponent: true
		});
	}
	return {
		id,
		name,
		interfaceName: name,
		isRebuild,
		cannotBeMainReason,
		hiddenInScrap,
		qadIdentity: null,
		vProject: 'PRJ1',
		photoFile: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		materials: [],
		scrapCodes
	};
}

function managerWith(groups: GroupFixture[], mode: 'rebuild' | 'scrap' | 'qntScrap') {
	const manager = new ScrapManager();
	const payload = {
		label: 'ABC123',
		match: {
			id: 1,
			code: 'ABC*',
			vProject: 'PRJ1',
			createdAt: new Date(),
			updatedAt: new Date(),
			groups: groups.map(group)
		}
	} as ScanInitPayload;
	manager.init(payload, 'ABC123');
	manager.setMode(mode);
	return manager;
}

const rowOf = (manager: ScrapManager, groupId: number) =>
	manager.scrapPayload.find((row) => row.groupId === groupId)!;

const rebuildLabel: GroupFixture[] = [
	{ id: MAIN_CARRIER, name: 'Main carrier', isRebuild: true, otherCode: 'SA850' },
	{ id: MIDDFIELD, name: 'Middfield', isRebuild: true, otherCode: 'SA860' },
	{ id: BELTLINE, name: 'Beltline', isRebuild: false }
];

describe('rebuild', () => {
	it('hides the other component checkbox until a main reason is chosen', () => {
		const manager = managerWith(rebuildLabel, 'rebuild');

		expect(manager.canMarkOtherComponent(MIDDFIELD)).toBe(false);
		expect(manager.canMarkOtherComponent(BELTLINE)).toBe(false);
	});

	it('marks the other rebuild groups as other component of the main reason group', () => {
		const manager = managerWith(rebuildLabel, 'rebuild');

		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);

		expect(rowOf(manager, MIDDFIELD)).toMatchObject({
			isOtherComponent: true,
			otherComponentCauseGroupId: MAIN_CARRIER
		});
		expect(rowOf(manager, BELTLINE).isOtherComponent).toBe(false);
		expect(manager.canMarkOtherComponent(BELTLINE)).toBe(true);
		expect(manager.canMarkOtherComponent(MAIN_CARRIER)).toBe(false);
		expect(manager.canSubmit).toBe(true);
	});

	it('lets the operator mark a small group and unmark an auto-marked group', () => {
		const manager = managerWith(rebuildLabel, 'rebuild');
		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);

		manager.setOtherComponent(BELTLINE, true);
		manager.setOtherComponent(MIDDFIELD, false);

		expect(rowOf(manager, BELTLINE)).toMatchObject({
			isOtherComponent: true,
			otherComponentCauseGroupId: MAIN_CARRIER
		});
		expect(rowOf(manager, MIDDFIELD)).toMatchObject({
			isOtherComponent: false,
			otherComponentCauseGroupId: null
		});
		expect(manager.relevantPayload.map((row) => row.groupId)).toEqual([MAIN_CARRIER, BELTLINE]);
	});

	it('unmarks the dependent rows when the main reason is cleared or changed to another variant', () => {
		const manager = managerWith(rebuildLabel, 'rebuild');
		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);
		manager.setOtherComponent(BELTLINE, true);

		manager.setOtherVariant(MAIN_CARRIER, true);

		expect(rowOf(manager, MIDDFIELD).isOtherComponent).toBe(false);
		expect(rowOf(manager, BELTLINE)).toMatchObject({
			isOtherComponent: false,
			otherComponentCauseGroupId: null
		});

		manager.setOtherVariant(MAIN_CARRIER, false);
		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);
		manager.clearScrapRow(MAIN_CARRIER);

		expect(rowOf(manager, MIDDFIELD).isOtherComponent).toBe(false);
	});

	it('blocks the save and flags the cause when the main reason group has no Other component scrap code', () => {
		const manager = managerWith(
			[
				{ id: MAIN_CARRIER, name: 'Main carrier', isRebuild: true },
				{ id: MIDDFIELD, name: 'Middfield', isRebuild: true, otherCode: 'SA860' }
			],
			'rebuild'
		);

		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);

		expect(manager.canSubmit).toBe(false);
		expect(manager.causeGroupIdsWithoutCode).toEqual([MAIN_CARRIER]);
	});

	it('flags no cause when the main reason group has its code', () => {
		const manager = managerWith(rebuildLabel, 'rebuild');

		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);

		expect(manager.causeGroupIdsWithoutCode).toEqual([]);
	});
});

const scrapLabel: GroupFixture[] = [
	{ id: MAIN_CARRIER, name: 'Main carrier', isRebuild: true, otherCode: 'SA850' },
	{ id: MIDDFIELD, name: 'Middfield', isRebuild: true, otherCode: 'SA860' },
	{ id: BELTLINE, name: 'Beltline', isRebuild: false },
	{ id: MA_POCKET, name: 'MA pocket', isRebuild: false }
];

describe('scrap', () => {
	it('offers only groups with a selected reason and an Other component scrap code as cause', () => {
		const manager = managerWith(scrapLabel, 'scrap');

		manager.selectScrap(BELTLINE, `R${BELTLINE}`);
		expect(manager.canMarkOtherComponent(MA_POCKET)).toBe(false);

		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);
		expect(manager.causeCandidates(MA_POCKET).map((row) => row.groupId)).toEqual([MAIN_CARRIER]);
		expect(manager.canMarkOtherComponent(MAIN_CARRIER)).toBe(false);
	});

	it('sets the cause automatically when there is a single candidate', () => {
		const manager = managerWith(scrapLabel, 'scrap');
		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);

		manager.setOtherComponent(BELTLINE, true);

		expect(rowOf(manager, BELTLINE).otherComponentCauseGroupId).toBe(MAIN_CARRIER);
		expect(manager.canSubmit).toBe(true);
	});

	it('requires choosing the cause when there are several candidates', () => {
		const manager = managerWith(scrapLabel, 'scrap');
		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);
		manager.selectScrap(MIDDFIELD, `R${MIDDFIELD}`);

		manager.setOtherComponent(BELTLINE, true);
		expect(rowOf(manager, BELTLINE).otherComponentCauseGroupId).toBeNull();
		expect(manager.canSubmit).toBe(false);

		manager.setOtherComponentCause(BELTLINE, MIDDFIELD);
		expect(rowOf(manager, BELTLINE).otherComponentCauseGroupId).toBe(MIDDFIELD);
		expect(manager.canSubmit).toBe(true);
	});

	it('unmarks the dependent row when its cause loses its reason', () => {
		const manager = managerWith(scrapLabel, 'scrap');
		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);
		manager.selectScrap(MIDDFIELD, `R${MIDDFIELD}`);
		manager.setOtherComponent(BELTLINE, true);
		manager.setOtherComponentCause(BELTLINE, MIDDFIELD);

		manager.clearScrapRow(MIDDFIELD);

		expect(rowOf(manager, BELTLINE)).toMatchObject({
			isOtherComponent: false,
			otherComponentCauseGroupId: null
		});
	});

	it('unmarks the dependent row when its cause becomes other component itself', () => {
		const manager = managerWith(scrapLabel, 'scrap');
		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);
		manager.selectScrap(MIDDFIELD, `R${MIDDFIELD}`);
		manager.setOtherComponent(BELTLINE, true);
		manager.setOtherComponentCause(BELTLINE, MIDDFIELD);

		manager.setOtherComponent(MIDDFIELD, true);

		expect(rowOf(manager, MIDDFIELD).otherComponentCauseGroupId).toBe(MAIN_CARRIER);
		expect(rowOf(manager, BELTLINE).isOtherComponent).toBe(false);
	});
});

describe('rebuild group that cannot be the main reason', () => {
	const label: GroupFixture[] = [
		{ id: MAIN_CARRIER, name: 'Main carrier', isRebuild: true, otherCode: 'SA850' },
		{ id: MIDDFIELD, name: 'Middfield', isRebuild: true, cannotBeMainReason: true }
	];

	it('cannot get a reason or another variant', () => {
		const manager = managerWith(label, 'rebuild');

		manager.selectScrap(MIDDFIELD, `R${MIDDFIELD}`);
		manager.setOtherVariant(MIDDFIELD, true);

		expect(manager.cannotBeMainReason(MIDDFIELD)).toBe(true);
		expect(rowOf(manager, MIDDFIELD)).toMatchObject({
			selectedScrapCode: null,
			isOtherVariant: false
		});
		expect(manager.canSubmit).toBe(false);
	});

	it('is marked as other component when another group is the main reason and can be unmarked', () => {
		const manager = managerWith(label, 'rebuild');

		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);
		expect(rowOf(manager, MIDDFIELD)).toMatchObject({
			isOtherComponent: true,
			otherComponentCauseGroupId: MAIN_CARRIER
		});
		expect(manager.canSubmit).toBe(true);

		manager.setOtherComponent(MIDDFIELD, false);
		expect(rowOf(manager, MIDDFIELD).isOtherComponent).toBe(false);
	});

	it('does not change scrap mode', () => {
		const manager = managerWith(label, 'scrap');

		manager.selectScrap(MIDDFIELD, `R${MIDDFIELD}`);

		expect(manager.cannotBeMainReason(MIDDFIELD)).toBe(false);
		expect(rowOf(manager, MIDDFIELD).selectedScrapCode).toBe(`R${MIDDFIELD}`);
	});
});

describe('part group hidden in scrap', () => {
	const label: GroupFixture[] = [
		{ id: MAIN_CARRIER, name: 'Main carrier', isRebuild: false, otherCode: 'SA850' },
		{ id: MIDDFIELD, name: 'Middfield', isRebuild: false, otherCode: 'SA860', hiddenInScrap: true },
		{ id: BELTLINE, name: 'Beltline', isRebuild: false }
	];
	const ids = (manager: ScrapManager) => manager.visibleRows.map((row) => row.groupId);

	it('leaves the hidden group out of the scrap form', () => {
		expect(ids(managerWith(label, 'scrap'))).toEqual([MAIN_CARRIER, BELTLINE]);
	});

	it('keeps every group in rebuild and quantity scrap', () => {
		const all = [MAIN_CARRIER, MIDDFIELD, BELTLINE];
		expect(ids(managerWith(label, 'rebuild'))).toEqual(all);
		expect(ids(managerWith(label, 'qntScrap'))).toEqual(all);
	});

	it('never offers the hidden group as the cause of an other component row', () => {
		const manager = managerWith(label, 'scrap');
		manager.selectScrap(MAIN_CARRIER, `R${MAIN_CARRIER}`);
		manager.selectScrap(MIDDFIELD, `R${MIDDFIELD}`);

		expect(manager.causeCandidates(BELTLINE).map((row) => row.groupId)).toEqual([MAIN_CARRIER]);
	});

	it('cannot submit when every group is hidden', () => {
		const manager = managerWith(
			label.map((g) => ({ ...g, hiddenInScrap: true })),
			'scrap'
		);

		expect(manager.visibleRows).toEqual([]);
		expect(manager.canSubmit).toBe(false);
	});
});
