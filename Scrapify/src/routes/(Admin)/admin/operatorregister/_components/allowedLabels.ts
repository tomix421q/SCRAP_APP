import type { LabelGroup, Operator } from '@prisma/client';

export type AllowedLabel = Pick<LabelGroup, 'id' | 'code' | 'vProject'>;
/** The part of an operator that decides which masks it may scan. */
export type OperatorLabelAccess = Pick<Operator, 'hasLabelRestriction'> & {
	allowedLabels: readonly AllowedLabel[];
};
export type LabelProjectGroup = { project: string; labels: AllowedLabel[] };

const NO_PROJECT = 'Bez projektu';

/** Slovak plural of "maska" for a count. */
function maskCount(count: number): string {
	if (count === 1) return '1 maska';
	if (count >= 2 && count <= 4) return `${count} masky`;
	return `${count} masiek`;
}

/** Groups labels by `vProject` (sorted by project, then code); labels without a project go last. */
export function groupLabelsByProject(labels: readonly AllowedLabel[]): LabelProjectGroup[] {
	const byProject = new Map<string | null, AllowedLabel[]>();
	for (const label of labels) {
		const group = byProject.get(label.vProject) ?? [];
		group.push(label);
		byProject.set(label.vProject, group);
	}
	return [...byProject.entries()]
		.sort(([a], [b]) => {
			if (a === null) return 1;
			if (b === null) return -1;
			return a.localeCompare(b);
		})
		.map(([project, group]) => ({
			project: project ?? NO_PROJECT,
			labels: group.toSorted((a, b) => a.code.localeCompare(b.code))
		}));
}

/** Short badges describing which masks an operator may scan. */
export function summarizeAllowedLabels(operator: OperatorLabelAccess): string[] {
	if (!operator.hasLabelRestriction) return ['Všetky masky'];
	if (operator.allowedLabels.length === 0) return ['Žiadna maska'];
	return groupLabelsByProject(operator.allowedLabels).map(
		(group) => `${group.project} · ${maskCount(group.labels.length)}`
	);
}
