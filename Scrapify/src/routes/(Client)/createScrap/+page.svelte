<script lang="ts">
	import { enhance } from '$app/forms';
	import { Label } from '@/components/ui/label';
	import type { PageProps } from './$types';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { CopyPlus, Heart, X } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import { onMount, tick } from 'svelte';
	import SearchScrapTable from '@/components/organism/Tables/SearchScrapTable.svelte';
	import { slide } from 'svelte/transition';
	import EditSearchScrapForm from '@/components/organism/Forms/EditSearchScrapForm.svelte';
	import { editSearchData } from '@/stores/stores';
	import { page } from '$app/state';

	let { data, form }: PageProps = $props();
	let { processes, parts, scrapCodes, scrapRecords, totalPartsQnt } = $derived(data.data);
	const user = $derived(data.user);
	let isSubmitting = $state(false);

	let favoriteProcesses = $state<{ id: string; name: string }[]>([]);
	let partId = $state('');
	let scrapId = $state('');
	let description = $state('');
	let quantity = $state('');
	let operatorId = $state('');

	let resetProcessCombo = $state(false);
	let resetPartCombo = $state(false);
	let resetScrapCodeCombo = $state(false);

	const fillLoggedOperator = () => {
		let getId = localStorage.getItem('operatorId');
		operatorId = getId ? getId : 'empty';
		if (operatorId === 'empty') {
			goto('/');
		}
	};

	let filterOptions: { processId: string } = $state({
		processId: ''
	});

	function applyFilter() {
		const params = new URLSearchParams();
		if (filterOptions.processId) params.set('processId', filterOptions.processId.toString());
		goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}
	async function clearFilter() {
		filterOptions.processId = '';
		resetProcessCombo = true;
		await tick();
		resetProcessCombo = false;
	}

	function addProcessToFavorite(process: { id: string; name: string }) {
		let getFavoriteProcessesFromLC = localStorage.getItem('favoriteProcesses')
			? JSON.parse(localStorage.getItem('favoriteProcesses') || '[]')
			: [];
		const isFavorite = getFavoriteProcessesFromLC.find((p: any) => p.id === process.id);

		if (isFavorite) {
			getFavoriteProcessesFromLC = getFavoriteProcessesFromLC.filter(
				(p: any) => p.id !== process.id
			);
			localStorage.setItem('favoriteProcesses', JSON.stringify(getFavoriteProcessesFromLC));
		} else {
			getFavoriteProcessesFromLC.push(process);
			localStorage.setItem('favoriteProcesses', JSON.stringify(getFavoriteProcessesFromLC));
		}
		favoriteProcesses = getFavoriteProcessesFromLC;
	}

	$effect(() => {
		if (typeof filterOptions.processId) {
			applyFilter();
		}
		favoriteProcesses = localStorage.getItem('favoriteProcesses')
			? JSON.parse(localStorage.getItem('favoriteProcesses') || '[]')
			: [];
	});

	onMount(() => {
		$editSearchData = undefined;
		const isFilter = page.url.searchParams.get('processId');
		if (isFilter) {
			filterOptions.processId = isFilter;
		}
	});

	// $inspect(processes);
</script>

<main class="flex flex-col lg:flex-wrap gap-10 relative">
	<div class="flex flex-col justify-center gap-6">
		<!-- Result info -->
		<section class="max-w-xl w-full mx-auto">
			<ResultInfo data={form} />
		</section>

		<section class="">
			<!--  -->
			<!-- Edit scrap -->
			{#if $editSearchData}
				<!-- data for edit change name ... -->
				{@const dataForEdit = { allPartsPromise: parts, scrapCodesPromise: scrapCodes }}
				<div transition:slide class="lg:min-h-[400px]">
					<EditSearchScrapForm data={dataForEdit} {form} />
				</div>
				<!--  -->
				<!-- Create scrap FORM -->
			{:else}
				<div class="lg:flex gap-3">
					{@render createScrapForm()}
					<!-- Favorite processes in LC -->
					<section
						class="{favoriteProcesses.length > 0
							? 'listNormalize max-w-2xs'
							: 'hidden'} overflow-y-auto h-fit max-h-[400px]"
					>
						<h3 class="lg:text-2xl text-primary font-bold mb-12 text-center">
							Your favorite process list<span class="text-[11px] text-muted block text-center"
								>Beta</span
							>
						</h3>
						<div class="flex flex-col gap-2">
							{#each favoriteProcesses as process}
								<div class="flex items-center gap-1">
									<Button
										size="sm"
										variant="outline"
										class="{filterOptions.processId === process.id ? 'bg-chart-4' : ''} w-full"
										onclick={() => {
											filterOptions.processId = process.id;
										}}
										>{process.name}
									</Button>
								</div>
							{/each}
						</div>
					</section>
				</div>
			{/if}
		</section>
	</div>

	<section>
		<SearchScrapTable
			findRecords={scrapRecords}
			totalRecords={scrapRecords.length}
			headerText={'Poslednych 20 zaznamov'}
			userInfo={user}
		/>
	</section>
</main>

{#snippet createScrapForm()}
	<div transition:slide>
		<form
			action="?/createScrap"
			method="POST"
			use:enhance={() => {
				isSubmitting = true;

				return async ({ update, result }) => {
					if (result?.type === 'success') {
						resetPartCombo = true;
						resetScrapCodeCombo = true;
					}
					await update();
					isSubmitting = false;
					resetPartCombo = false;
					resetScrapCodeCombo = false;
				};
			}}
			class="formNormalize lg:w-2xl"
		>
			<h2 class="text-center font-semibold text-2xl text-primary mb-6">Vytvorit scrap</h2>

			<!-- -->
			<!-- process COMBO -->
			<article class="flex justify-between items-center gap-2">
				<Label for="processId" class="text-sm md:text-lg"
					>Process <span class="text-xs text-chart-info tracking-widest">[Filter]</span></Label
				>

				<div class="flex gap-2">
					<!-- if filter  -->
					{#if filterOptions.processId}
						{@const actuallProcess = processes.find(
							(process) => process.id === Number(filterOptions.processId)
						)}
						<!-- Clear filter -->
						<Button
							size="icon"
							variant="ghost"
							title="Vymazat filter"
							class="text-destructive my-auto hover:text-destructive {filterOptions.processId
								? 'flex'
								: 'hidden'}"
							onclick={() => clearFilter()}><X /></Button
						>
						<!-- Heart -->
						<Button
							class="my-auto text-chart-success hover:text-chart-success hidden sm:block"
							variant="ghost"
							title="Pridat do oblubenych"
							onclick={() =>
								actuallProcess &&
								addProcessToFavorite({
									id: actuallProcess.id.toString(),
									name: actuallProcess.name
								})}
							><Heart
								class={actuallProcess?.id ===
								Number(favoriteProcesses.find((item) => Number(item.id) === actuallProcess?.id)?.id)
									? 'fill-chart-success'
									: ''}
							/></Button
						>
					{/if}
					<Combobox
						dataBox={processes}
						bind:value={filterOptions.processId}
						reset={resetProcessCombo}
						id="processId"
						nameLabel="nameAndHall"
					/>
				</div>
			</article>
			<!-- -->
			<!-- part COMBO -->
			<article class="flex justify-between items-center gap-2">
				<Label for="partId" class="text-sm md:text-lg">Part</Label>
				<div class="flex gap-2">
					<Combobox
						dataBox={parts}
						bind:value={partId}
						reset={resetPartCombo}
						id="partId"
						nameLabel="partnumSideColor"
					/>
				</div>
				<input type="hidden" name="partId" required bind:value={partId} />
			</article>
			<!-- -->
			<!-- scrap code COMBO -->
			<article class="flex justify-between items-center gap-2">
				<Label for="scrapCodeId" class="text-sm md:text-lg">Scrap Code</Label>
				<div class="flex gap-2">
					<Combobox
						dataBox={scrapCodes}
						bind:value={scrapId}
						reset={resetScrapCodeCombo}
						id="scrapCodeId"
						nameLabel="codeName"
					/>
				</div>
				<input type="hidden" name="scrapCodeId" required bind:value={scrapId} />
			</article>
			<!-- -->
			<!-- input description -->
			<article class="flex justify-between items-center gap-2">
				<Label for="description" class="text-sm md:text-lg">Opis</Label>
				<Input
					placeholder="Description"
					name="description"
					id="description"
					class="inputNormalize max-w-[250px]"
					bind:value={description}
				/>
			</article>
			<!-- -->
			<!-- input quantity -->
			<article class="flex justify-between items-center gap-2">
				<Label for="quantity" class="text-sm md:text-lg">Mnozstvo</Label>
				<Input
					placeholder="Quantity"
					name="quantity"
					id="quantity"
					class="inputNormalize max-w-[250px]"
					bind:value={quantity}
				/>
			</article>
			<!-- -->
			<!-- input createdBy -->
			<article class="flex justify-between items-center gap-2">
				<Label for="operatorId" class="text-sm md:text-lg">Operator ID</Label>
				<div class="flex w-[290px]">
					<Button
						size="icon"
						variant="ghost"
						class="my-auto text-chart-success hover:text-chart-success"
						title="Doplnit ID operatora"
						onclick={() => {
							fillLoggedOperator();
						}}><CopyPlus /></Button
					>
					<Input
						placeholder="Operator id"
						name="operatorId"
						id="operatorId"
						class="inputNormalize ml-2"
						bind:value={operatorId}
					/>
				</div>
			</article>

			<Button type="submit" class="mt-10 w-fit mx-auto">
				{#if isSubmitting}
					<span>Submitting...</span>
				{:else}
					Vytvorit scrap
				{/if}
			</Button>
		</form>
	</div>
{/snippet}
