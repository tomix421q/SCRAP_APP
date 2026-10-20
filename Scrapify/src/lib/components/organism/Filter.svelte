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
	import { onMount, tick } from 'svelte';

	let {
		allProjects,
		whereUse
	}: { allProjects?: { id: string; name: string }[]; whereUse?: 'scrapCode' | 'part' } = $props();

	let filterOptions: FilterType = $state({
		partNumber: '',
		vProject: '',
		vHall: '',
		partId: '',
		scrapCode: '',
		scrapName: '',
		processName: '',
		projectName: '',
		description: '',
		dateFrom: '',
		dateTo: ''
	});
	let resetProcessCombo = $state(false);

	function applyFilter() {
		const params = new URLSearchParams();
		if (filterOptions.partNumber) params.set('partNumber', filterOptions.partNumber);
		if (filterOptions.vProject) params.set('vProject', filterOptions.vProject);
		if (filterOptions.vHall) params.set('vHall', filterOptions.vHall);
		if (filterOptions.partId) params.set('partId', filterOptions.partId);
		if (filterOptions.scrapCode) params.set('scrapCode', filterOptions.scrapCode);
		if (filterOptions.scrapName) params.set('scrapName', filterOptions.scrapName);
		if (filterOptions.description) params.set('description', filterOptions.description);
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
	// 2025-11-20T22:33
	function getTodayShift(whichShift: 'morning' | 'afternoon' | 'night') {
		let date = new Date();
		let actuallDate = date.getUTCFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getUTCDate();
		let actuallDateNightShift =
			date.getUTCFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getUTCDate() + 1);
		if (whichShift === 'morning') {
			let startTime = actuallDate + 'T06:00';
			let stopTime = actuallDate + 'T14:00';
			filterOptions.dateFrom = startTime;
			filterOptions.dateTo = stopTime;
		}
		if (whichShift === 'afternoon') {
			let startTime = actuallDate + 'T14:00';
			let stopTime = actuallDate + 'T22:00';
			filterOptions.dateFrom = startTime;
			filterOptions.dateTo = stopTime;
		}
		if (whichShift === 'night') {
			let startTime = actuallDate + 'T22:00';
			let stopTime = actuallDateNightShift + 'T06:00';
			filterOptions.dateFrom = startTime;
			filterOptions.dateTo = stopTime;
		}

		// console.log(date);
	}

	async function clearFilter() {
		filterOptions.vProject = '';
		filterOptions.vHall = '';
		filterOptions.scrapCode = '';
		filterOptions.scrapName = '';
		filterOptions.partId = '';
		filterOptions.description = '';
		filterOptions.partNumber = '';
		filterOptions.dateFrom = '';
		filterOptions.dateTo = '';
		resetProcessCombo = true;
		await tick();
		resetProcessCombo = false;

		goto(page.url.pathname, { keepFocus: true, noScroll: true, replaceState: true });
	}

	onMount(() => {
		clearFilter();
		if (page.url.search) {
			goto(page.url.pathname, {
				replaceState: true,
				noScroll: true,
				keepFocus: true
			});
		}
	});
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
						class="inputNormalize max-w-[350px]"
						placeholder="Search part number"
						bind:value={filterOptions.partNumber}
					/>
				</article>
				<!--  -->
				<article
					class="justify-between items-center gap-2 {whereUse === 'scrapCode'
						? 'hidden'
						: 'lg:flex'}"
				>
					<Label class="text-sm w-[200px]">vProject</Label>
					<Input
						class="inputNormalize max-w-[350px]"
						placeholder="Search project"
						bind:value={filterOptions.vProject}
					/>
				</article>
				<!--  -->
				<article
					class="justify-between items-center gap-2 {whereUse === 'scrapCode'
						? 'hidden'
						: 'lg:flex'}"
				>
					<Label class="text-sm w-[200px]">vHall</Label>
					<Input
						class="inputNormalize max-w-[350px]"
						placeholder="Search project"
						bind:value={filterOptions.vHall}
					/>
				</article>
				<!-- Scrap filter [code] -->
				<article
					class="justify-between items-center gap-2 {whereUse === 'part' ? 'hidden' : 'lg:flex'}"
				>
					<Label class="text-sm w-[200px]">Scrap Code</Label>
					<Input
						class="inputNormalize max-w-[350px]"
						placeholder="Search scrap code"
						bind:value={filterOptions.scrapCode}
					/>
				</article>
				<!-- Scrap filter [name] -->
				<article
					class="justify-between items-center gap-2 {whereUse === 'part' ? 'hidden' : 'lg:flex'}"
				>
					<Label class="text-sm w-[200px]">Name</Label>
					<Input
						class="inputNormalize max-w-[350px]"
						placeholder="Scrap name..."
						bind:value={filterOptions.scrapName}
					/>
				</article>

				<article class="lg:flex justify-between items-center gap-2">
					<Label class="text-sm w-[100px]">Description</Label>

					<Input
						class="inputNormalize max-w-[350px]"
						placeholder="Description info..."
						bind:value={filterOptions.description}
					/>
				</article>
				{#if allProjects}
					<article class="lg:flex justify-between items-center gap-2">
						<Label for="filterProcess" class="text-sm w-[100px]">Project</Label>
						<div class="inputNormalize border-primary border-b">
							<Combobox
								id="filterProcess"
								dataBox={allProjects}
								bind:value={filterOptions.vProject}
								reset={resetProcessCombo}
							/>
						</div>
					</article>
				{/if}

				<!-- <article
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
				</article> -->
			</div>

			<!--  -->
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
				<article class="mt-4">
					<p class="text-muted-foreground">Fast search today:</p>
					<div class="flex flex-col gap-2 text-primary w-fit">
						<Button variant="secondary" size="sm" onclick={() => getTodayShift('morning')}
							>From 06:00 - To 14:00</Button
						>
						<Button variant="secondary" size="sm" onclick={() => getTodayShift('afternoon')}
							>From 14:00 - To 22:00</Button
						>
						<Button variant="secondary" size="sm" onclick={() => getTodayShift('night')}
							>From 22:00 - To 06:00</Button
						>
					</div>
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
