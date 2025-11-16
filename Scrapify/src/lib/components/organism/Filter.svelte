<!-- Filter -->
<script lang="ts">
	import { Scan, X } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';
	import CardContent from '../ui/card/card-content.svelte';
	import CardHeader from '../ui/card/card-header.svelte';
	import CardTitle from '../ui/card/card-title.svelte';
	import Card from '../ui/card/card.svelte';
	import { Input } from '../ui/input';
	import Label from '../ui/label/label.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CardFooter from '../ui/card/card-footer.svelte';
	import type { FilterType } from '@/utils/types';
	import Combobox from '../atoms/Combobox.svelte';
	import { tick } from 'svelte';
	import type { Process, Project } from '@prisma/client';

	let {
		allProcesses,
		allProjects,
		whereUse
	}: { allProcesses: Process[]; allProjects?: Project[]; whereUse?: 'scrapCode' | 'part' } =
		$props();

	const filterOptions: FilterType = $state({
		partNumber: '',
		partId: '',
		scrapCode: '',
		processName: '',
		projectName: '',
		dateFrom: '',
		dateTo: ''
	});
	let resetProcessCombo = $state(false);
	let resetProjectCombo = $state(false);

	function applyFilter() {
		const params = new URLSearchParams();
		if (filterOptions.partNumber) params.set('partNumber', filterOptions.partNumber);
		if (filterOptions.partId) params.set('partId', filterOptions.partId);
		if (filterOptions.scrapCode) params.set('scrapCode', filterOptions.scrapCode);
		if (filterOptions.processName) params.set('processName', filterOptions.processName);
		if (filterOptions.projectName) params.set('projectName', filterOptions.projectName);
		if (filterOptions.dateFrom) params.set('dateFrom', filterOptions.dateFrom);
		if (filterOptions.dateTo) params.set('dateTo', filterOptions.dateTo);

		goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}
	function keyBoardSubmit(e: KeyboardEvent) {
		// enter = submit
		if (e.key === 'Enter') {
			applyFilter();
			e.preventDefault();
		}
	}
	async function clearFilter() {
		filterOptions.scrapCode = '';
		filterOptions.partId = '';
		filterOptions.processName = '';
		filterOptions.projectName = '';
		filterOptions.partNumber = '';
		filterOptions.dateFrom = '';
		filterOptions.dateTo = '';
		resetProcessCombo = true;
		resetProjectCombo = true;
		await tick();
		resetProcessCombo = false;
		resetProjectCombo = true;

		goto(page.url.pathname, { keepFocus: true, noScroll: true, replaceState: true });
	}

	// $inspect(whereUse);
</script>

<main>
	<Card class="bg-transparent formNormalize h-auto">
		<CardHeader>
			<CardTitle class="text-2xl tracking-widest text-center text-primary">Filter</CardTitle>
		</CardHeader>

		<CardContent
			class="space-y-6 lg:gap-x-24 {whereUse === 'scrapCode' || whereUse === 'part'
				? 'flex-row'
				: 'lg:flex'}"
		>
			<div class="space-y-6 md:space-y-3">
				<article
					class="justify-between items-center gap-2 {whereUse === 'scrapCode'
						? 'hidden'
						: 'lg:flex'}"
				>
					<Label class="text-sm w-[200px]">Part Number</Label>
					<Input
						class="inputNormalize"
						placeholder="Search part number"
						bind:value={filterOptions.partNumber}
					/>
				</article>
				<article
					class="justify-between items-center gap-2 {whereUse === 'scrapCode'
						? 'hidden'
						: 'lg:flex'}"
				>
					<Label class="text-sm w-[200px]">Part Id</Label>
					<Input
						class="inputNormalize"
						placeholder="Search part id"
						bind:value={filterOptions.partId}
					/>
				</article>
				<article
					class="justify-between items-center gap-2 {whereUse === 'part' ? 'hidden' : 'lg:flex'}"
				>
					<Label class="text-sm w-[200px]">Scrap Code</Label>
					<Input
						class="inputNormalize"
						placeholder="Search scrap code"
						bind:value={filterOptions.scrapCode}
					/>
				</article>
				<article class="lg:flex justify-between items-center gap-2">
					<Label class="text-sm w-[100px]">Process</Label>
					<div class="inputNormalize border-primary border-b">
						<Combobox
							dataBox={allProcesses}
							bind:value={filterOptions.processName}
							reset={resetProcessCombo}
						/>
					</div>
				</article>
				<article
					class="justify-between items-center gap-2 {whereUse === 'scrapCode'
						? 'hidden'
						: 'lg:flex'}"
				>
					<Label class="text-sm w-[100px]">Project</Label>
					<div class="inputNormalize border-primary border-b">
						<Combobox
							dataBox={allProjects ?? []}
							bind:value={filterOptions.projectName}
							reset={resetProjectCombo}
						/>
					</div>
				</article>
			</div>
			<div
				class="space-y-6 md:space-y-3 {whereUse === 'scrapCode' || whereUse === 'part'
					? 'hidden'
					: ''}"
			>
				<article class="lg:flex justify-between items-center gap-2">
					<Label class="text-sm w-[200px]">Date from</Label>
					<Input type="datetime-local" class="inputNormalize" bind:value={filterOptions.dateFrom} />
				</article>
				<article class="lg:flex justify-between items-center gap-2">
					<Label class="text-sm w-[200px]">Date To</Label>
					<Input type="datetime-local" class="inputNormalize" bind:value={filterOptions.dateTo} />
				</article>
			</div>
		</CardContent>
		<CardFooter>
			<div class="flex justify-center w-full gap-4">
				<Button
					variant="default"
					type="submit"
					onclick={() => {
						applyFilter();
					}}><Scan />Apply</Button
				>
				<Button variant="destructive" onclick={clearFilter}><X />Clear</Button>
			</div>
		</CardFooter>
	</Card>
</main>

<svelte:window on:keydown={keyBoardSubmit} />
