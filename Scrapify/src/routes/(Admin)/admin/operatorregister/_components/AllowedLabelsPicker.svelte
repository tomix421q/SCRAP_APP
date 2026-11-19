<script lang="ts">
	import type { SvelteSet } from 'svelte/reactivity';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Badge } from '@/components/ui/badge';
	import { matchesFuzzy } from '@/utils/index';
	import { quantityScrapLabelPrefix } from '@/utils/quantityScrap';
	import { groupLabelsByProject, type AllowedLabel } from './allowedLabels';

	let {
		labels,
		selectedIds,
		allLabels = $bindable(),
		idPrefix
	}: {
		labels: readonly AllowedLabel[];
		/** Mutated in place; the owner renders it as hidden form inputs. */
		selectedIds: SvelteSet<number>;
		allLabels: boolean;
		idPrefix: string;
	} = $props();

	let filter = $state('');

	// Bulk selection works on whole projects, including labels hidden by the filter.
	const projectGroups = $derived(groupLabelsByProject(labels));
	const visibleGroups = $derived(
		projectGroups
			.map((group) => ({
				...group,
				visible: group.labels.filter((label) => matchesFuzzy(label.code, filter))
			}))
			.filter((group) => group.visible.length > 0)
	);

	const selectedCount = (group: { labels: AllowedLabel[] }) =>
		group.labels.filter((label) => selectedIds.has(label.id)).length;

	function setProject(group: { labels: AllowedLabel[] }, selected: boolean) {
		for (const label of group.labels) {
			if (selected) selectedIds.add(label.id);
			else selectedIds.delete(label.id);
		}
	}

	function toggleLabel(id: number, checked: boolean) {
		if (checked) selectedIds.add(id);
		else selectedIds.delete(id);
	}
</script>

<section class="flex flex-col gap-3">
	<div class="flex items-center gap-2">
		<Checkbox id="{idPrefix}-all" bind:checked={allLabels} />
		<Label for="{idPrefix}-all">Všetky masky</Label>
		<span class="ml-auto text-sm text-muted-foreground">Vybrané: {selectedIds.size}</span>
	</div>

	<fieldset disabled={allLabels} class="flex flex-col gap-3 disabled:opacity-50">
		<legend class="sr-only">Allowed labels</legend>
		<Input
			type="search"
			bind:value={filter}
			placeholder="Filter by code"
			aria-label="Filter labels by code"
			class="inputNormalize"
		/>

		<div class="flex max-h-[40dvh] flex-col gap-4 overflow-y-auto pr-1">
			{#each visibleGroups as group (group.project)}
				{@const selected = selectedCount(group)}
				<article class="flex flex-col gap-2">
					<header class="flex flex-wrap items-center gap-2 border-b border-border pb-1">
						<span class="font-semibold">{group.project}</span>
						<span class="text-sm text-muted-foreground">{selected}/{group.labels.length}</span>
						<div class="ml-auto flex gap-1">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={allLabels || selected === group.labels.length}
								onclick={() => setProject(group, true)}
							>
								Vybrať všetky
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={allLabels || selected === 0}
								onclick={() => setProject(group, false)}
							>
								Zrušiť
							</Button>
						</div>
					</header>
					<ul class="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{#each group.visible as label (label.id)}
							{@const checkboxId = `${idPrefix}-label-${label.id}`}
							<li class="flex items-center gap-2">
								<Checkbox
									id={checkboxId}
									disabled={allLabels}
									checked={selectedIds.has(label.id)}
									onCheckedChange={(checked) => toggleLabel(label.id, checked)}
								/>
								<Label for={checkboxId} class="break-all font-normal">{label.code}</Label>
								{#if label.code.startsWith(quantityScrapLabelPrefix)}
									<Badge variant="secondary">QNT</Badge>
								{/if}
							</li>
						{/each}
					</ul>
				</article>
			{:else}
				<p class="text-sm text-muted-foreground">No labels match the filter.</p>
			{/each}
		</div>
	</fieldset>
</section>
