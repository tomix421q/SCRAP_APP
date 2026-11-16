<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '@/components/ui/button/button.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import {
		addDays,
		dashboardRangeLabels,
		dashboardRanges,
		defaultDashboardRange,
		type DashboardRange
	} from '@/utils/dashboardFilters';
	import type { DashboardStats } from '@/server/dashboardStats';
	import { X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let { filters, projects }: { filters: DashboardStats['filters']; projects: string[] } = $props();

	/** Above this many projects the buttons would wrap too much, so a Combobox is used. */
	const maxProjectButtons = 8;

	const projectItems = $derived(projects.map((project) => ({ id: project, name: project })));

	// Custom range picker is open while the URL has a custom range or after clicking "Custom".
	let isCustomOpen = $derived(filters.range === 'custom');
	// Editable drafts; reset from the URL after every navigation.
	let customFrom = $derived(filters.from ?? toDateInput(addDays(new Date(), -7)));
	let customTo = $derived(filters.to ?? toDateInput(new Date()));

	/** Local date as `YYYY-MM-DD` (the value format of `<input type="date">`). */
	function toDateInput(date: Date) {
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${date.getFullYear()}-${month}-${day}`;
	}

	function navigate(updates: Record<string, string | undefined>) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [key, value] of Object.entries(updates)) {
			if (value) params.set(key, value);
			else params.delete(key);
		}
		const query = params.toString();
		goto(query ? `?${query}` : page.url.pathname, { keepFocus: true, noScroll: true });
	}

	function selectRange(range: DashboardRange) {
		if (range === 'custom') {
			isCustomOpen = true;
			return;
		}
		navigate({
			range: range === defaultDashboardRange ? undefined : range,
			from: undefined,
			to: undefined
		});
	}

	function applyCustomRange(event: SubmitEvent) {
		event.preventDefault();
		navigate({ range: 'custom', from: customFrom, to: customTo });
	}

	function selectProject(project: string | undefined) {
		navigate({ project });
	}
</script>

<div class="flex flex-col">
	<!-- Filters sit right above the tiles they filter, in their own compact box
	     so they don't read as a second header nav. -->
	<div
		class="flex flex-col gap-2 rounded-xl border border-border bg-card/40 p-2 backdrop-blur-lg sm:w-fit sm:self-center"
	>
		<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
			{@render segmented('Project', projectSegment)}
			{@render segmented('Period', periodSegment)}
		</div>

		{#if isCustomOpen}
			<form
				onsubmit={applyCustomRange}
				class="flex flex-wrap items-end gap-2 border-t border-border pt-2 text-xs"
			>
				<label class="flex flex-col text-muted-foreground">
					From
					<input
						class="inputNormalize text-sm text-foreground"
						type="date"
						bind:value={customFrom}
						required
					/>
				</label>
				<label class="flex flex-col text-muted-foreground">
					To
					<input
						class="inputNormalize text-sm text-foreground"
						type="date"
						bind:value={customTo}
						required
					/>
				</label>
				<Button type="submit" size="sm" variant="outline" class="h-7 px-3 text-xs">Apply</Button>
			</form>
		{/if}
	</div>
</div>

{#snippet segmented(label: string, content: Snippet)}
	<div role="group" aria-label={label} class="flex items-center gap-2">
		<span
			class="w-14 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground sm:w-auto"
		>
			{label}
		</span>
		<div class="flex flex-wrap items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
			{@render content()}
		</div>
	</div>
{/snippet}

{#snippet segmentButton(text: string, isActive: boolean, onclick: () => void)}
	<Button
		type="button"
		size="sm"
		variant={isActive ? 'default' : 'ghost'}
		class="h-7 rounded-md px-2.5 text-xs {isActive ? '' : 'text-muted-foreground'}"
		aria-pressed={isActive}
		{onclick}
	>
		{text}
	</Button>
{/snippet}

{#snippet projectSegment()}
	{#if projects.length > maxProjectButtons}
		<Combobox
			dataBox={projectItems}
			value={filters.project ?? ''}
			onchange={(project) => selectProject(project || undefined)}
			firstText="All projects"
			width="xs"
		/>
		{#if filters.project}
			<Button
				type="button"
				size="icon"
				variant="ghost"
				class="size-7"
				title="All projects"
				aria-label="Show all projects"
				onclick={() => selectProject(undefined)}
			>
				<X class="size-4" />
			</Button>
		{/if}
	{:else}
		{#each [undefined, ...projects] as project (project ?? '')}
			{@render segmentButton(project ?? 'All', filters.project === project, () =>
				selectProject(project)
			)}
		{/each}
	{/if}
{/snippet}

{#snippet periodSegment()}
	<!-- Highlights the range in the URL (the one the tiles show), not an unapplied Custom. -->
	{#each dashboardRanges as range (range)}
		{@render segmentButton(dashboardRangeLabels[range].button, filters.range === range, () =>
			selectRange(range)
		)}
	{/each}
{/snippet}
