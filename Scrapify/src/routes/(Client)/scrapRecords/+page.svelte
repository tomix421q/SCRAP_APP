<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { FileSpreadsheet, Funnel, LoaderCircle, RotateCcw, X } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';
	import { dateTimePartsLocalTimeDb } from '@/utils/index';
	import {
		isOtherVariant,
		scrapRecordTypeBadgeVariant,
		scrapRecordTableColumns,
		scrapRecordType,
		tableColumnLabels,
		type ScrapRecordTableColumnKey
	} from './columns';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import { Badge } from '@/components/ui/badge';
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
		'w-full max-w-[300px] h-9 rounded-lg border border-border bg-background/35 px-3 text-sm text-foreground shadow-inner backdrop-blur-sm transition placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30';

	const labelClass =
		'flex min-w-0 max-w-full flex-col gap-1 text-xs font-medium text-muted-foreground';
	const groupClass = 'flex min-w-0 flex-col gap-2';
	const legendClass = 'mb-1 text-[11px] font-semibold uppercase tracking-wider text-chart-1/80';

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
	type FilterKey = (typeof filterKeys)[number];
	type FilterState = Record<FilterKey, string>;

	const filterLabels: Record<FilterKey, string> = {
		dmc: 'Label',
		scrapCode: 'Scrap code',
		partGroup: 'Part group',
		project: 'Project',
		createdBy: 'Created by',
		dateFrom: 'Date from',
		dateTo: 'Date to',
		exported: 'QAD export',
		otherComponent: 'Other component',
		otherVariant: 'Other variant',
		replacementPart: 'Replacement part'
	};

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

	function chipValue(key: FilterKey, value: string) {
		switch (key) {
			case 'otherComponent':
			case 'otherVariant':
				return value === 'true' ? 'Yes' : value === 'false' ? 'No' : value;
			case 'exported':
				return value === 'true' ? 'Exported' : value === 'false' ? 'Not exported' : value;
			case 'dateFrom':
			case 'dateTo':
				return value.replace('T', ' ');
			default:
				return value;
		}
	}

	type ActiveChip = { key: FilterKey | 'category'; label: string };

	// Chips reflect the applied filters (URL), not the unsaved form draft.
	const activeChips = $derived.by((): ActiveChip[] => {
		const params = page.url.searchParams;
		const chips: ActiveChip[] = filterKeys.flatMap((key) => {
			const value = params.get(key)?.trim();
			return value ? [{ key, label: `${filterLabels[key]}: ${chipValue(key, value)}` }] : [];
		});
		if (data.category !== 'all') {
			const category = categoryOptions.find((option) => option.id === data.category);
			chips.push({ key: 'category', label: `Category: ${category?.label ?? data.category}` });
		}
		return chips;
	});

	function removeChip(key: ActiveChip['key']) {
		if (key === 'category') {
			selectCategory('all');
			return;
		}
		const params = new URLSearchParams(page.url.searchParams);
		params.delete(key);
		// Same rule as selecting a project: scrap code and part group depend on it.
		if (key === 'project') {
			params.delete('scrapCode');
			params.delete('partGroup');
		}
		params.delete('page');
		goto(`${page.url.pathname}?${params.toString()}`, { keepFocus: true, noScroll: true });
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

	<h1 class="sr-only">Scrap records</h1>

	<!-- One compact panel: categories, filters, actions and active filter chips.
	     Same width as the table section below (window width, at most 1920px). -->
	<form
		onsubmit={applyFilters}
		class="formNormalize ml-[calc(50%_-_min(50vw_-_1rem,960px))] w-[min(calc(100vw_-_2rem),1920px)] gap-y-3! p-3! lg:p-4!"
	>
		<nav aria-label="Scrap record category" class="flex flex-wrap gap-1">
			{#each categoryOptions as categoryOption (categoryOption.id)}
				<Button
					type="button"
					variant={data.category === categoryOption.id ? 'default' : 'ghost'}
					size="sm"
					class="rounded-lg px-3 transition-all"
					aria-pressed={data.category === categoryOption.id}
					onclick={() => selectCategory(categoryOption.id)}
				>
					{@const totals = categoryTotals.get(categoryOption.id)}
					<span>{categoryOption.label}</span>
					<span class="text-xs font-normal tabular-nums opacity-60" title="Records">
						{totals?.count ?? 0}
					</span>
					<!-- Pieces only differ from the record count for quantity scrap (quantity > 1). -->
					{#if totals && totals.quantity !== totals.count}
						<span class="text-xs font-normal tabular-nums opacity-50" title="Total pieces">
							· {totals.quantity} pcs
						</span>
					{/if}
				</Button>
			{/each}
		</nav>

		<!-- Filters grouped by meaning into four equal columns (stacked on small screens). -->
		<div class="grid gap-4 border-t border-border pt-3 sm:grid-cols-2 xl:grid-cols-4">
			<fieldset class={groupClass}>
				<legend class={legendClass}>Part</legend>
				<label class={labelClass}>
					Project
					<div class="flex min-w-0 max-w-full items-center gap-1">
						<Combobox
							dataBox={projectItems}
							value={filters.project}
							onchange={selectProject}
							firstText="All projects"
							width="xs"
						/>
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
				<label class={labelClass}>
					Part group
					<div class="flex min-w-0 max-w-full items-center gap-1">
						<Combobox
							dataBox={partGroupItems}
							bind:value={filters.partGroup}
							firstText="Select part group"
							width="xs"
						/>
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
				<label class={labelClass}>
					Scrap code
					<div class="flex min-w-0 max-w-full items-center gap-1">
						<Combobox
							dataBox={data.scrapCodeOptions}
							bind:value={filters.scrapCode}
							firstText="Select scrap code"
							nameLabel="codeName"
							width="xs"
						/>
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
			</fieldset>

			<fieldset class={groupClass}>
				<legend class={legendClass}>Record</legend>
				<label class={labelClass}>
					Label
					<input
						class={fieldClass}
						type="search"
						placeholder="Search label"
						bind:value={filters.dmc}
					/>
				</label>
				<label class={labelClass}>
					Created by
					<input
						class={fieldClass}
						type="search"
						placeholder="Card number"
						bind:value={filters.createdBy}
					/>
				</label>
				<label class={labelClass}>
					Replacement part
					<input
						class={fieldClass}
						type="search"
						placeholder="Part number"
						bind:value={filters.replacementPart}
					/>
				</label>
			</fieldset>

			<fieldset class={groupClass}>
				<legend class={legendClass}>Flags</legend>
				<label class={labelClass}>
					Other component
					<select class={fieldClass} bind:value={filters.otherComponent}>
						<option value="">All</option>
						<option value="true">Yes</option>
						<option value="false">No</option>
					</select>
				</label>
				<label class={labelClass}>
					Other variant
					<select class={fieldClass} bind:value={filters.otherVariant}>
						<option value="">All</option>
						<option value="true">Yes</option>
						<option value="false">No</option>
					</select>
				</label>
				<label class={labelClass}>
					QAD export
					<select class={fieldClass} bind:value={filters.exported}>
						<option value="">All</option>
						<option value="true">Exported</option>
						<option value="false">Not exported</option>
					</select>
				</label>
			</fieldset>

			<fieldset class={groupClass}>
				<legend class={legendClass}>Created date</legend>
				<label class={labelClass}>
					From
					<input class={fieldClass} type="datetime-local" bind:value={filters.dateFrom} />
				</label>
				<label class={labelClass}>
					To
					<input class={fieldClass} type="datetime-local" bind:value={filters.dateTo} />
				</label>
			</fieldset>
		</div>

		<!-- Active filter chips on the left, actions bottom right. -->
		<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
			<div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
				{#if activeChips.length}
					<span class="text-xs text-muted-foreground">Active filters:</span>
					{#each activeChips as chip (chip.key)}
						<Badge variant="outline" class="gap-1 pr-0.5">
							{chip.label}
							<button
								type="button"
								class="-my-1 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								aria-label="Remove filter {chip.label}"
								title="Remove filter"
								onclick={() => removeChip(chip.key)}
							>
								<X class="size-3" />
							</button>
						</Badge>
					{/each}
				{:else}
					<span class="text-xs text-muted-foreground">No active filters</span>
				{/if}
			</div>
			<div class="ml-auto flex flex-wrap gap-2">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					class="rounded-lg text-destructive hover:bg-destructive/20"
					onclick={clearFilters}
				>
					<RotateCcw class="size-4" />
					Clear
				</Button>
				<Button type="submit" size="sm" class="rounded-lg px-4">
					<Funnel class="size-4" />
					Apply
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
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
			</div>
		</div>
	</form>

	<!-- Breaks out of the layout max-width: as wide as the window, at most 1920px, centered. -->
	<section
		class="my-6 ml-[calc(50%_-_min(50vw_-_1rem,960px))] w-[min(calc(100vw_-_2rem),1920px)] space-y-3 text-sm"
	>
		<article class="listNormalize p-2! lg:p-3!">
			<!-- Own scroll box (viewport height) keeps the header and pagination in reach; the inner ui/table
			     wrapper must not scroll, otherwise the sticky header would not stick. -->
			<div
				class="max-h-[calc(100dvh-5rem)] overflow-auto rounded-lg border border-border transition-opacity [&>[data-slot=table-container]]:overflow-visible {navigating.to
					? 'pointer-events-none opacity-60'
					: ''}"
				aria-busy={Boolean(navigating.to)}
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
											<Badge variant={scrapRecordTypeBadgeVariant[type]}>{type}</Badge>
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
