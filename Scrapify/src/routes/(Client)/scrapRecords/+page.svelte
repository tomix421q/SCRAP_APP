<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		CalendarDays,
		FileSpreadsheet,
		Funnel,
		LoaderCircle,
		RotateCcw,
		SlidersHorizontal,
		X
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';
	import { dateTimePartsLocalTimeDb } from '@/utils/index';
	import {
		isOtherVariant,
		scrapRecordTableColumns,
		scrapRecordType,
		tableColumnLabels,
		type ScrapRecordTableColumnKey,
		type ScrapRecordType
	} from './columns';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import { Badge, type BadgeVariant } from '@/components/ui/badge';
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

	// Shared look of text inputs, selects and date inputs in the filter form.
	const fieldClass =
		'h-10 rounded-lg border border-border bg-background/35 px-3 text-sm text-foreground shadow-inner backdrop-blur-sm transition placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30';

	const typeBadgeVariant: Record<ScrapRecordType, BadgeVariant> = {
		Scrap: 'outline',
		Rebuild: 'chart-warning',
		'Quantity scrap': 'chart-2'
	};

	// The first column of each group gets a divider.
	const groupStartKeys = new Set<ScrapRecordTableColumnKey>(
		scrapRecordTableColumns
			.filter((column, index) => column.group !== scrapRecordTableColumns[index - 1]?.group)
			.map((column) => column.key)
	);
	const groupDivider = 'border-l-2 border-l-border';

	// ID and DMC stay visible on horizontal scroll; `left-14` matches the ID column width (w-14).
	const stickyColumnClass: Partial<Record<ScrapRecordTableColumnKey, string>> = {
		id: 'sticky left-0',
		dmc: 'sticky left-14'
	};
	const rightAligned = new Set<ScrapRecordTableColumnKey>(['id', 'quantity']);

	// Header cells are sticky on top; set here (not via `*:` on the row) so z-index can differ.
	const headBase =
		'sticky top-0 h-auto py-1.5 border-b border-border bg-card! bg-clip-border bg-linear-to-r from-chart-4/40 to-chart-4/40 text-xs font-semibold uppercase tracking-wide text-chart-1';

	function headClass(key: ScrapRecordTableColumnKey, widthClass: string) {
		return [
			headBase,
			widthClass,
			stickyColumnClass[key] ? `${stickyColumnClass[key]} z-30` : 'z-20',
			groupStartKeys.has(key) && key !== 'id' ? groupDivider : '',
			rightAligned.has(key) ? 'text-right' : ''
		].join(' ');
	}

	function cellClass(key: ScrapRecordTableColumnKey) {
		return [
			'py-1',
			// Sticky cells need an opaque base; row stripe/hover tints are layered on top as an image.
			stickyColumnClass[key]
				? `${stickyColumnClass[key]} z-10 bg-card! bg-clip-border group-odd:bg-linear-to-r group-odd:from-muted/10 group-odd:to-muted/10 group-hover:bg-linear-to-r group-hover:from-muted/50 group-hover:to-muted/50`
				: '',
			groupStartKeys.has(key) && key !== 'id' ? groupDivider : '',
			rightAligned.has(key) ? 'text-right tabular-nums' : ''
		].join(' ');
	}

	let { data, form }: PageProps = $props();
	const projectItems = $derived(data.projects.map((project) => ({ id: project, name: project })));
	const partGroupItems = $derived(data.partGroups.map((name) => ({ id: name, name })));
	const filterKeys = [
		'dmc',
		'scrapCode',
		'partGroup',
		'project',
		'createdBy',
		'dateFrom',
		'dateTo',
		'exported',
		'otherComponent',
		'otherVariant',
		'replacementPart'
	] as const;
	type FilterState = Record<(typeof filterKeys)[number], string>;

	function filtersFrom(params: URLSearchParams): FilterState {
		return Object.fromEntries(filterKeys.map((key) => [key, params.get(key) ?? ''])) as FilterState;
	}

	let filters = $state(filtersFrom(new URLSearchParams()));
	const columnCount = $derived(scrapRecordTableColumns.length + (data.canDelete ? 1 : 0));

	// Categories are exhaustive (quantity scrap vs. rebuild/scrap), so "All" is their sum.
	const categoryTotals = $derived.by(() => {
		const totals = new Map<string, { count: number; quantity: number }>();
		for (const summary of data.categorySummaries) totals.set(summary.id, summary);
		totals.set('all', {
			count: data.categorySummaries.reduce((sum, summary) => sum + summary.count, 0),
			quantity: data.categorySummaries.reduce((sum, summary) => sum + summary.quantity, 0)
		});
		return totals;
	});

	// Filters are an editable draft: inputs and Combobox bind to its properties and it is
	// reset from the URL after every navigation. A writable $derived would return a plain
	// (non-proxied) object, so property bindings would not be reactive; hence $state + $effect.
	$effect(() => {
		filters = filtersFrom(page.url.searchParams);
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
		filters = filtersFrom(new URLSearchParams());
		goto(page.url.pathname, { keepFocus: true, noScroll: true, replaceState: true });
	}

	let isExporting = $state(false);
	const canExport = $derived(!isExporting && data.totalRecords > 0);

	/** Downloads all records matching the applied filters (current URL, not the unsaved form). */
	async function exportRecords() {
		if (!canExport) return;
		isExporting = true;
		try {
			const params = new URLSearchParams(page.url.searchParams);
			params.delete('page');
			const response = await fetch(`${page.url.pathname}/export?${params.toString()}`, {
				headers: { accept: 'application/json' }
			});
			if (!response.ok) {
				const body: { message?: string } | null = await response.json().catch(() => null);
				toast.error(body?.message ?? 'Export failed. Please try again later.');
				return;
			}
			const blob = await response.blob();
			const disposition = response.headers.get('content-disposition') ?? '';
			const fileName = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'scrap_records.xlsx';
			const objectUrl = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = objectUrl;
			link.download = fileName;
			link.click();
			// Revoking right after click() can cancel the download in some browsers.
			setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
		} catch (err) {
			console.error('Scrap records export failed:', err);
			toast.error('Export failed. Check the connection and try again.');
		} finally {
			isExporting = false;
		}
	}
</script>

<svelte:head>
	<title>Scrap records | Scrapify</title>
</svelte:head>

<main class="space-y-6">
	<ResultInfo data={form} />

	<nav
		aria-label="Scrap record category"
		class="flex flex-wrap gap-2 rounded-2xl border border-dashed border-primary/20 bg-card/40 p-2 shadow-lg backdrop-blur-lg"
	>
		{#each categoryOptions as categoryOption (categoryOption.id)}
			<Button
				type="button"
				variant={data.category === categoryOption.id ? 'default' : 'ghost'}
				class="rounded-lg px-5 transition-all"
				aria-pressed={data.category === categoryOption.id}
				onclick={() => selectCategory(categoryOption.id)}
			>
				{@const totals = categoryTotals.get(categoryOption.id)}
				<span>{categoryOption.label}</span>
				<span class="rounded-full bg-background/30 px-1.5 text-xs tabular-nums">
					{totals?.count ?? 0}
				</span>
				<span class="text-xs tabular-nums opacity-70" title="Total quantity">
					Σ {totals?.quantity ?? 0}
				</span>
			</Button>
		{/each}
	</nav>

	<form onsubmit={applyFilters} class="formNormalize gap-y-4!">
		<header class="flex items-center justify-between gap-4 border-b border-border px-1 pb-4">
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

		<div class="grid gap-4">
			<fieldset class="rounded-lg border border-border bg-card/30 p-4">
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
							class={fieldClass}
							type="search"
							placeholder="Search label"
							bind:value={filters.dmc}
						/>
					</label>
					<label class="flex max-w-64 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						Created by
						<input
							class={fieldClass}
							type="search"
							placeholder="Operator or user"
							bind:value={filters.createdBy}
						/>
					</label>
					<label class="flex max-w-64 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						QAD export
						<select class={fieldClass} bind:value={filters.exported}>
							<option value="">All</option>
							<option value="true">Exported</option>
							<option value="false">Not exported</option>
						</select>
					</label>
					<label class="flex max-w-64 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						Other component
						<select class={fieldClass} bind:value={filters.otherComponent}>
							<option value="">All</option>
							<option value="true">Yes</option>
							<option value="false">No</option>
						</select>
					</label>
					<label class="flex max-w-64 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						Other variant
						<select class={fieldClass} bind:value={filters.otherVariant}>
							<option value="">All</option>
							<option value="true">Yes</option>
							<option value="false">No</option>
						</select>
					</label>
					<label class="flex max-w-64 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						Replacement part
						<input
							class={fieldClass}
							type="search"
							placeholder="Part number"
							bind:value={filters.replacementPart}
						/>
					</label>
				</div>
			</fieldset>

			<fieldset class="rounded-lg border border-border bg-card/30 p-4">
				<legend class="flex items-center gap-2 px-2 text-sm font-medium text-foreground/90">
					<CalendarDays class="size-4 text-primary" />
					Created date
				</legend>
				<div class="grid max-w-4xl gap-2 sm:grid-cols-2">
					<label class="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						From
						<input
							class="{fieldClass} min-w-0 max-w-[420px]"
							type="datetime-local"
							bind:value={filters.dateFrom}
						/>
					</label>
					<label class="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
						To
						<input
							class="{fieldClass} min-w-0 max-w-[420px]"
							type="datetime-local"
							bind:value={filters.dateTo}
						/>
					</label>
				</div>
			</fieldset>
		</div>

		<footer class="flex flex-wrap items-center justify-end gap-3 border-t border-border px-1 pt-4">
			<div class="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					class="rounded-lg"
					disabled={!canExport}
					aria-busy={isExporting}
					onclick={exportRecords}
				>
					{#if isExporting}
						<LoaderCircle class="size-4 animate-spin" />
					{:else}
						<FileSpreadsheet class="size-4" />
					{/if}
					Export ({data.totalRecords})
				</Button>
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

	<!-- Breaks out of the layout max-width: as wide as the window, at most 1920px, centered. -->
	<section
		class="my-10 ml-[calc(50%_-_min(50vw_-_1rem,960px))] w-[min(calc(100vw_-_2rem),1920px)] space-y-3 text-sm"
	>
		<header class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
			<h2 class="text-lg font-bold tracking-widest">
				{categoryOptions.find((option) => option.id === data.category)?.label} records
			</h2>
		</header>
		<article class="listNormalize p-2! lg:p-3!">
			<!-- Own scroll box (viewport height) keeps the header and pagination in reach; the inner ui/table
			     wrapper must not scroll, otherwise the sticky header would not stick. -->
			<div
				class="max-h-[calc(100dvh-5rem)] overflow-auto rounded-lg border border-border [&>[data-slot=table-container]]:overflow-visible"
			>
				<Table.Root class="min-w-[1500px] w-full table-fixed border-separate border-spacing-0">
					<Table.Header>
						<Table.Row class="border-0">
							{#each scrapRecordTableColumns as column (column.key)}
								{@const [mainLabel, ...subLabels] = tableColumnLabels(column)}
								<Table.Head class={headClass(column.key, column.widthClass)}>
									<div class="leading-tight">{mainLabel}</div>
									{#if subLabels.length}
										<div class="text-[10px] font-normal leading-tight text-chart-1/70">
											{subLabels.join(' · ')}
										</div>
									{/if}
								</Table.Head>
							{/each}
							{#if data.canDelete}
								<!-- Deleting is rare: narrow column, label only for screen readers. -->
								<Table.Head class="{headBase} z-20 w-12 px-1 {groupDivider}">
									<span class="sr-only">Actions</span>
								</Table.Head>
							{/if}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.records as record (record.id)}
							{@const type = scrapRecordType(record)}
							{@const createdAt = dateTimePartsLocalTimeDb(record.createdAt)}
							<Table.Row
								class="group border-0 odd:bg-muted/10 *:truncate *:border-b *:border-border"
							>
								{#each scrapRecordTableColumns as column (column.key)}
									{@const cellClasses = cellClass(column.key)}
									{#if column.key === 'id'}
										<Table.Cell
											class="{cellClasses} text-muted-foreground"
											title={String(record.id)}
										>
											{record.id}
										</Table.Cell>
									{:else if column.key === 'dmc'}
										<Table.Cell class="{cellClasses} font-medium text-primary" title={record.dmc}>
											{record.dmc}
										</Table.Cell>
									{:else if column.key === 'type'}
										<Table.Cell class={cellClasses}>
											<Badge variant={typeBadgeVariant[type]}>{type}</Badge>
										</Table.Cell>
									{:else if column.key === 'part'}
										<Table.Cell
											class={cellClasses}
											title="{record.partGroup.name} · {record.partGroup.vProject ?? '—'}"
										>
											<div class="truncate leading-tight">{record.partGroup.name}</div>
											<div class="truncate text-xs leading-tight text-muted-foreground">
												{record.partGroup.vProject ?? '—'}
											</div>
										</Table.Cell>
									{:else if column.key === 'reason'}
										<Table.Cell
											class={cellClasses}
											title={[record.scrapCode, record.scrapCodeDescription]
												.filter(Boolean)
												.join(' · ')}
										>
											{#if record.scrapCode || record.scrapCodeDescription}
												<div class="truncate font-medium leading-tight">
													{record.scrapCode ?? '—'}
												</div>
												<div class="truncate text-xs leading-tight text-muted-foreground">
													{record.scrapCodeDescription ?? '—'}
												</div>
											{:else}
												—
											{/if}
										</Table.Cell>
									{:else if column.key === 'flags'}
										<Table.Cell class={cellClasses}>
											<div class="flex flex-wrap gap-1">
												{#if record.isOtherComponent}
													<Badge variant="outline" class="text-muted-foreground">Other comp.</Badge>
												{/if}
												{#if isOtherVariant(record)}
													<Badge>Other variant</Badge>
												{/if}
											</div>
										</Table.Cell>
									{:else if column.key === 'replacementPart'}
										<Table.Cell
											class={cellClasses}
											title={record.replacementPartMaterial?.trim() ?? ''}
										>
											{record.replacementPartMaterial?.trim() || '—'}
										</Table.Cell>
									{:else if column.key === 'quantity'}
										<Table.Cell class={cellClasses}>{record.quantity}</Table.Cell>
									{:else if column.key === 'createdBy'}
										<Table.Cell
											class={cellClasses}
											title={data.operatorNames[record.createdBy] ?? record.createdBy}
										>
											{record.createdBy}
										</Table.Cell>
									{:else if column.key === 'createdAt'}
										<Table.Cell class={cellClasses}>
											<div class="leading-tight">{createdAt.date}</div>
											<div class="text-xs leading-tight text-muted-foreground">
												{createdAt.time}
											</div>
										</Table.Cell>
									{/if}
								{/each}
								{#if data.canDelete}
									<!-- overflow-visible: the confirm buttons are wider than the column and overlap to the left. -->
									<Table.Cell class="{groupDivider} overflow-visible! px-1">
										<DeleteBtn id={record.id} actionRoute="?/deleteScrapRecord" />
									</Table.Cell>
								{/if}
							</Table.Row>
						{:else}
							<Table.Row class="border-0">
								<Table.Cell colspan={columnCount} class="py-8 text-center text-muted-foreground">
									No records match these filters.
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</article>
	</section>

	<Pagination totalPages={data.totalPages} />
</main>
