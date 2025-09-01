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

	let { allProcesses } = $props();

	const filterOptions: FilterType = $state({
		partNumber: '',
		partId: '',
		scrapCode: '',
		processName: '',
		dateFrom: '',
		dateTo: ''
	});
	let resetProcessCombo = $state(false);
	function applyFilter() {
		const params = new URLSearchParams();
		if (filterOptions.partNumber) params.set('partNumber', filterOptions.partNumber);
		if (filterOptions.partId) params.set('partId', filterOptions.partId);
		if (filterOptions.scrapCode) params.set('scrapCode', filterOptions.scrapCode);
		if (filterOptions.processName) params.set('processName', filterOptions.processName);
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
		filterOptions.partNumber = '';
		filterOptions.dateFrom = '';
		filterOptions.dateTo = '';
		resetProcessCombo = true;
		await tick();
		resetProcessCombo = false;

		goto(page.url.pathname, { keepFocus: true, noScroll: true, replaceState: true });
	}

	// $inspect(allProcesses);
</script>

<main>
	<Card class="formNormalize">
		<CardHeader>
			<CardTitle class="text-2xl tracking-widest">Filter</CardTitle>
		</CardHeader>

		<CardContent class="space-y-6 lg:flex lg:gap-x-24">
			<div class="space-y-6 md:space-y-3">
				<article class="lg:flex justify-between items-center gap-2 max-w-[500px]">
					<Label class="text-sm w-[200px]">Part Number</Label>
					<Input
						class="inputNormalize"
						placeholder="Search scrap code"
						bind:value={filterOptions.partNumber}
					/>
				</article>
				<article class="lg:flex justify-between items-center gap-2 max-w-[500px]">
					<Label class="text-sm w-[200px]">Part Id</Label>
					<Input
						class="inputNormalize"
						placeholder="Search part id"
						bind:value={filterOptions.partId}
					/>
				</article>
				<article class="lg:flex justify-between items-center gap-2 max-w-[500px]">
					<Label class="text-sm w-[200px]">Scrap Code</Label>
					<Input
						class="inputNormalize"
						placeholder="Search scrap code"
						bind:value={filterOptions.scrapCode}
					/>
				</article>
				<article class="lg:flex justify-between items-center gap-2 max-w-[500px]">
					<Label class="text-sm w-[100px]">Process name</Label>
					<div class="inputNormalize border-primary border-b">
						<Combobox
							dataBox={allProcesses}
							bind:value={filterOptions.processName}
							reset={resetProcessCombo}
						/>
					</div>
				</article>
			</div>
			<div class="space-y-6 md:space-y-3">
				<article class="lg:flex justify-between items-center gap-2 max-w-[300px]">
					<Label class="text-sm w-[200px]">Date from</Label>
					<Input type="date" class="inputNormalize" bind:value={filterOptions.dateFrom} />
				</article>
				<article class="lg:flex justify-between items-center gap-2 max-w-[300px]">
					<Label class="text-sm w-[200px]">Date To</Label>
					<Input type="date" class="inputNormalize" bind:value={filterOptions.dateTo} />
				</article>
			</div>
		</CardContent>
		<CardFooter>
			<div class="flex justify-center w-full gap-4">
				<Button variant="default" type="submit" onclick={applyFilter}><Scan />Apply</Button>
				<Button variant="destructive" onclick={clearFilter}><X />Clear</Button>
			</div>
		</CardFooter>
	</Card>
</main>

<svelte:window on:keydown={keyBoardSubmit} />
