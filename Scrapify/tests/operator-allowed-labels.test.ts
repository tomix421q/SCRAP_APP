import { describe, expect, it } from 'vitest';
import {
	groupLabelsByProject,
	summarizeAllowedLabels
} from '../src/routes/(Admin)/admin/operatorregister/_components/allowedLabels';

const label = (id: number, code: string, vProject: string | null) => ({ id, code, vProject });

describe('summarizeAllowedLabels', () => {
	it('shows all masks when the operator is not restricted, whatever is selected', () => {
		expect(
			summarizeAllowedLabels({ hasLabelRestriction: false, allowedLabels: [label(1, 'X4', 'X540')] })
		).toEqual(['Všetky masky']);
	});

	it('shows no mask for a restricted operator without labels', () => {
		expect(summarizeAllowedLabels({ hasLabelRestriction: true, allowedLabels: [] })).toEqual([
			'Žiadna maska'
		]);
	});

	it('shows each project with a correctly declined count', () => {
		const allowedLabels = [
			label(1, 'A', 'X540'),
			label(2, 'B', 'X540'),
			label(3, 'C', 'X540'),
			label(4, 'D', 'B9'),
			...[5, 6, 7, 8, 9].map((id) => label(id, `E${id}`, 'Z1')),
			label(10, 'F', null)
		];
		expect(summarizeAllowedLabels({ hasLabelRestriction: true, allowedLabels })).toEqual([
			'B9 · 1 maska',
			'X540 · 3 masky',
			'Z1 · 5 masiek',
			'Bez projektu · 1 maska'
		]);
	});
});

describe('groupLabelsByProject', () => {
	it('groups labels by project, sorted, with labels without a project last', () => {
		const groups = groupLabelsByProject([
			label(1, 'X4', 'X540'),
			label(2, 'Q', null),
			label(3, 'A1', 'B9'),
			label(4, 'X1', 'X540')
		]);
		expect(groups.map((group) => [group.project, group.labels.map((l) => l.id)])).toEqual([
			['B9', [3]],
			['X540', [4, 1]],
			['Bez projektu', [2]]
		]);
	});
});
