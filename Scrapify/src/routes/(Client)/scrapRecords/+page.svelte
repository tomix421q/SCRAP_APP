<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { CalendarDays, Funnel, RotateCcw, SlidersHorizontal, X } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { dateTimeLocalTimeDb } from '@/utils/index';
	import { quantityScrapLabelPrefix } from '@/utils/quantityScrap';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import DeleteBtn from '@/components/molecules/DeleteBtn.svelte';
	import Pagination from '@/components/molecules/Pagination.svelte';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import * as Table from '@/components/ui/table';

	const categoryOptions = [
		{ id: 'all', label: 'All' },
		{ id: 'rebuild', label: 'Rebuild' },
		{ id: 'scrap', label: 'Scrap' },
		{ id: 'quantity', label: 'Quantity scrap' }
	] as const;

	let { data, form }: PageProps = $props();
	const projectItems = $derived(data.projects.map((project) => ({ id: project, name: project })));
	const partGroupItems = $derived(data.partGroups.map((name) => ({ id: name, name })));
	let filters = $state({
		dmc: '',
		scrapCode: '',
		partGroup: '',
		project: '',
		createdBy: '',
		dateFrom: '',
		dateTo: '',
		exported: '',
		otherComponent: ''
	});

	$effect(() => {
		const params = page.url.searchParams;
		filters = {
			dmc: params.get('dmc') ?? '',
			scrapCode: params.get('scrapCode') ?? '',
			partGroup: params.get('partGroup') ?? '',
			project: params.get('project') ?? '',
			createdBy: params.get('createdBy') ?? '',
			dateFrom: params.get('dateFrom') ?? '',
			dateTo: params.get('dateTo') ?? '',
			exported: params.get('exported') ?? '',
			otherComponent: params.get('otherComponent') ?? ''
		};
	});

	function applyFilters(event: SubmitEvent) {
		event.preventDefault();
		applyFilterState();
	}

	function applyFilterState() {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(filters)) {
			if (value.trim()) params.set(key, value.trim());
		}
		if (data.category !== 'all') params.set('category', data.category);
		params.delete('page');
		goto(`${page.url.pathname}?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	function selectCategory(category: (typeof categoryOptions)[number]['id']) {
		const params = new URLSearchParams(page.url.searchParams);
		params.delete('page');
		if (category === 'all') params.delete('category');
		else params.set('category', category);
		goto(`${page.url.pathname}?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	function selectProject(project: string) {
		filters.project = project;
		filters.scrapCode = '';
		filters.partGroup = '';
		applyFilterState();
	}

	function clearFilters() {
		filters = {
			dmc: '',
			scrapCode: '',
			partGroup: '',
			project: '',
			createdBy: '',
			dateFrom: '',
			dateTo: '',
			exported: '',
			otherComponent: ''
		};
		goto(page.url.pathname, { keepFocus: true, noScroll: true, replaceState: true });
	}
</script>

<svelte:head>
	<title>Scrap records | Scrapify</title>
</svelte:head>

<main class="space-y-6">
	<ResultInfo data={form} />

	<nav
		aria-label="Scrap record category"
		class="flex flex-wrap gap-2 rounded-lg border border-white/20 bg-white/10 p-2 shadow-lg backdrop-blur-xl"
	>
		{#each categoryOptions as categoryOption (categoryOption.id)}
			<Button
				type="button"
				variant={data.category === categoryOption.id ? 'default' : 'ghost'}
				class="rounded-lg px-5 transition-all"
				aria-pressed={data.category === categoryOption.id}
				onclick={() => selectCategory(categoryOption.id)}
			>
				{categoryOption.label}
			</Button>
		{/each}
	</nav>

	<form
		onsubmit={applyFilters}
		class="relative isolate overflow-hidden rounded-lg border border-white/20 bg-background/45 shadow-2xl backdrop-blur-2xl"
	>
		<div
			class="pointer-events-none absolute -right-20 -top-28 -z-10 size-72 rounded-full bg-primary/20 blur-3xl"
		></div>
		<header
			class="flex items-center justify-between gap-4 border-b border-white/15 bg-background/20 px-5 py-4"
		>
			<div class="flex items-center gap-3">
				<div class="rounded-lg border border-primary/20 bg-primary/10 p-2.5 text-primary">
					<SlidersHorizontal class="size-5" />
				</div>
				<div>
					<h2 class="font-semibold tracking-wide">Filter records</h2>
					<p class="text-xs text-muted-foreground">Narrow down the scrap record list</p>
				</div>
			</div>
		</header>

		<div class="grid gap-4 p-4 sm:p-5">
			<fieldset class="rounded-lg border border-white/15 bg-background/20 p-4">
				<legend class="px-2 text-sm font-medium text-foreground/90 flex items-center gap-2"
					><Funnel class="size-4 stroke-primary" /> Record filters</legend
				>
				<div class="flex flex-wrap items-end gap-x-2 gap-y-2">
					<label
						class="flex w-[430px] max-w-full flex-col gap-1.5 text-xs font-medium text-muted-foreground"
					>
						Project
						<div class="flex min-w-0 items-center gap-1">
							<div class="min-w-0">
								<Combobox
									dataBox={projectItems}
									value={filters.project}
									onchange={selectProject}
									firstText="All projects"
									width="sm"
								/>
							</div>
							{#if filters.project}
								<Button
									type="button"
									title="Clear project"
									aria-label="Clear project filter"
									size="icon"
									variant="ghost"
									class="shrink-0 text-destructive hover:bg-destructive/50"
									onclick={() => selectProject('')}
								>
									<X />
								</Button>
							{/if}
						</div>
					</label>
					<label
						class="flex w-[430px] max-w-full flex-col gap-1.5 text-xs font-medium text-muted-foreground"
					>
						Scrap code
						<div class="flex min-w-0 items-center gap-1">
							<div class="min-w-0">
								<Combobox
									dataBox={data.scrapCodeOptions}
									bind:value={filters.scrapCode}
									firstText="Select scrap code"
									nameLabel="codeName"
									width="sm"
								/>
							</div>
							{#if filters.scrapCode}
								<Button
									type="button"
									title="Clear scrap code"
									aria-label="Clear scrap code filter"
									size="icon"
									variant="ghost"
									class="shrink-0 text-destructive hover:bg-destructive/50"
									onclick={() => (filters.scrapCode = '')}
								>
									<X />
								</Button>
							{/if}
						</div>
					</label>
					<label
						class="flex w-[430px] max-w-full flex-col gap-1.5 text-xs font-medium text-muted-foreground"
					>
						Part group
						<div class="flex min-w-0 items-center gap-1">
							<div class="min-w-0">
								<Combobox
									dataBox={partGroupItems}
									bind:value={filters.partGroup}
									firstText="Select part group"
									width="sm"
								/>
							</div>
							{#if filters.partGroup}
								<Button
									type="button"
									title="Clear part group"
									aria-label="Clear part group filter"
									size="icon"
									variant="ghost"
									class="shrink-0 text-destructive hover:bg-destructive/50"
									onclick={() => (filters.partGroup = '')}
								>
									<X />
								</Button>
							{/if}
						</div>
					</label>
				</div>
				<div class="mt-3 flex flex-wrap gap-x-3 gap-y-2">
					<label class="flex max-w-64 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						Label
						<input
							class="h-10 rounded-lg border border-white/15 bg-background/35 px-3 text-sm text-foreground shadow-inner backdrop-blur-sm transition placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
							type="search"
							placeholder="Search label"
							bind:value={filters.dmc}
						/>
					</label>
					<label class="flex max-w-64 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						Created by
						<input
							class="h-10 rounded-lg border border-white/15 bg-background/35 px-3 text-sm text-foreground shadow-inner backdrop-blur-sm transition placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
							type="search"
							placeholder="Operator or user"
							bind:value={filters.createdBy}
						/>
					</label>
					<label class="flex max-w-64 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						QAD export
						<select
							class="h-10 rounded-lg border border-white/15 bg-background/35 px-3 text-sm text-foreground shadow-inner backdrop-blur-sm transition focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
							bind:value={filters.exported}
						>
							<option value="">All</option>
							<option value="true">Exported</option>
							<option value="false">Not exported</option>
						</select>
					</label>
					<label class="flex max-w-64 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						Other component
						<select
							class="h-10 rounded-lg border border-white/15 bg-background/35 px-3 text-sm text-foreground shadow-inner backdrop-blur-sm transition focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
							bind:value={filters.otherComponent}
						>
							<option value="">All</option>
							<option value="true">Yes</option>
							<option value="false">No</option>
						</select>
					</label>
				</div>
			</fieldset>

			<fieldset class="rounded-lg border border-white/15 bg-background/20 p-4">
				<legend class="flex items-center gap-2 px-2 text-sm font-medium text-foreground/90">
					<CalendarDays class="size-4 text-primary" />
					Created date
				</legend>
				<div class="grid max-w-4xl gap-2 sm:grid-cols-2">
					<label class="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						From
						<input
							class="h-10 min-w-0 max-w-[420px] rounded-lg border border-white/15 bg-background/35 px-3 text-sm text-foreground shadow-inner backdrop-blur-sm transition focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
							type="datetime-local"
							bind:value={filters.dateFrom}
						/>
					</label>
					<label class="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						To
						<input
							class="h-10 min-w-0 max-w-[420px] rounded-lg border border-white/15 bg-background/35 px-3 text-sm text-foreground shadow-inner backdrop-blur-sm transition focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
							type="datetime-local"
							bind:value={filters.dateTo}
						/>
					</label>
				</div>
			</fieldset>
		</div>

		<footer
			class="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 bg-background/20 px-4 py-3 sm:px-5"
		>
			<div class="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
				<p>Total records: <strong class="text-chart-3">{data.totalRecords}</strong></p>
				<p>Total quantity: <strong class="text-chart-3">{data.totalQuantity}</strong></p>
			</div>
			<div class="flex flex-wrap gap-2">
				<Button type="button" variant="destructive" class="rounded-lg" onclick={clearFilters}>
					<RotateCcw class="size-4" />
					Clear
				</Button>
				<Button type="submit" class="rounded-lg px-5 shadow-lg shadow-primary/20">
					<SlidersHorizontal class="size-4" />
					Apply filters
				</Button>
			</div>
		</footer>
	</form>

	<section class="my-10 space-y-3 text-sm">
		<header class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
			<h2 class="text-lg font-bold tracking-widest">
				{categoryOptions.find((option) => option.id === data.category)?.label} records
			</h2>
		</header>
		<article
			class="overflow-x-auto rounded-lg border border-white/25 bg-white/10 p-2 shadow-2xl backdrop-blur-2xl sm:p-3"
		>
			<Table.Root class="min-w-[1450px] w-full table-fixed">
				<Table.Header>
					<Table.Row
						class="bg-primary/15 *:border-white/10 *:font-bold text-lg *:text-muted-foreground *:border"
					>
						<Table.Head class="w-10">ID</Table.Head>
						<Table.Head class="w-36">DMC</Table.Head>
						<Table.Head class="w-32">Part group</Table.Head>
						<Table.Head class="w-24">Project</Table.Head>
						<Table.Head class="w-24">Scrap code</Table.Head>
						<Table.Head class="w-28">Description</Table.Head>
						<Table.Head class="w-20">Quantity</Table.Head>
						<Table.Head class="w-28">Type</Table.Head>
						<Table.Head class="w-24">Created by</Table.Head>
						<Table.Head class="w-40">Created at</Table.Head>
						{#if data.canDelete}
							<Table.Head class="w-20 text-end">Actions</Table.Head>
						{/if}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.records as record (record.id)}
						<Table.Row
							class="*:truncate *:border-white/10 odd:bg-white/5 even:bg-transparent hover:bg-primary/10 *:border"
						>
							<Table.Cell class="text-muted-foreground" title={String(record.id)}
								>{record.id}</Table.Cell
							>
							<Table.Cell class="font-medium text-primary" title={record.dmc}>
								{record.dmc}
							</Table.Cell>
							<Table.Cell title={record.partGroup.name}>{record.partGroup.name}</Table.Cell>
							<Table.Cell title={record.partGroup.vProject ?? ''}>
								{record.partGroup.vProject ?? '—'}
							</Table.Cell>
							<Table.Cell title={record.scrapCode ?? ''}>{record.scrapCode ?? '—'}</Table.Cell>
							<Table.Cell title={record.scrapCodeDescription ?? ''}>
								{record.scrapCodeDescription ?? '—'}
							</Table.Cell>
							<Table.Cell>{record.quantity}</Table.Cell>
							<Table.Cell>
								{record.dmc.startsWith(quantityScrapLabelPrefix)
									? 'Quantity scrap'
									: record.isRebuild
										? 'Rebuild'
										: 'Scrap'}
							</Table.Cell>
							<Table.Cell title={record.createdBy}>{record.createdBy}</Table.Cell>
							<Table.Cell>{dateTimeLocalTimeDb(record.createdAt)}</Table.Cell>
							{#if data.canDelete}
								<Table.Cell>
									<div class="flex justify-end">
										<DeleteBtn id={record.id} actionRoute="?/deleteScrapRecord" />
									</div>
								</Table.Cell>
							{/if}
						</Table.Row>
					{:else}
						<Table.Row class="*:border-white/10">
							<Table.Cell
								colspan={data.canDelete ? 11 : 10}
								class="py-8 text-center text-muted-foreground"
							>
								No records match these filters.
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</article>
	</section>

	<Pagination totalPages={data.totalPages} />
</main>
