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

	let { filters, projects }: { filters: DashboardStats['filters']; projects: string[] } =
		$props();

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

<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
	<p
		class="truncate bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text font-mono text-lg font-extrabold tracking-wider text-transparent lg:text-xl"
	>
		Your central point for waste reduction.
	</p>

	<div class="flex flex-col gap-2 lg:items-end">
		<nav aria-label="Project" class="flex flex-wrap items-center gap-1">
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
						title="All projects"
						aria-label="Show all projects"
						onclick={() => selectProject(undefined)}
					>
						<X class="size-4" />
					</Button>
				{/if}
			{:else}
				{#each [undefined, ...projects] as project (project ?? '')}
					<Button
						type="button"
						size="sm"
						variant={filters.project === project ? 'default' : 'ghost'}
						class="rounded-lg px-3"
						aria-pressed={filters.project === project}
						onclick={() => selectProject(project)}
					>
						{project ?? 'All projects'}
					</Button>
				{/each}
			{/if}
		</nav>

		<nav aria-label="Period" class="flex flex-wrap items-center gap-1">
			<!-- Highlights the range in the URL (the one the tiles show), not an unapplied Custom. -->
			{#each dashboardRanges as range (range)}
				<Button
					type="button"
					size="sm"
					variant={filters.range === range ? 'default' : 'ghost'}
					class="rounded-lg px-3"
					aria-pressed={filters.range === range}
					onclick={() => selectRange(range)}
				>
					{dashboardRangeLabels[range].button}
				</Button>
			{/each}
		</nav>

		{#if isCustomOpen}
			<form onsubmit={applyCustomRange} class="flex flex-wrap items-end gap-2 text-sm">
				<label class="flex flex-col text-muted-foreground">
					From
					<input class="inputNormalize text-foreground" type="date" bind:value={customFrom} required />
				</label>
				<label class="flex flex-col text-muted-foreground">
					To
					<input class="inputNormalize text-foreground" type="date" bind:value={customTo} required />
				</label>
				<Button type="submit" size="sm" variant="outline">Apply</Button>
			</form>
		{/if}
	</div>
</div>
