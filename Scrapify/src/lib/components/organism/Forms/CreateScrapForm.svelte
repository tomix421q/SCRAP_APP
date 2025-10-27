<script lang="ts">
	import { enhance } from '$app/forms';
	import Label from '@/components/ui/label/label.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { tick } from 'svelte';
	import { CopyPlus, Heart, X } from '@lucide/svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import { goto } from '$app/navigation';
	import { favoriteProcesses } from '@/stores/stores';
	import type { ProcessWithRelations } from '@/utils/types';
	import type { Part, ScrapCode } from '@prisma/client';

	let {
		processes,
		parts,
		scrapCodes,
		filterOptions = $bindable()
	}: {
		processes: ProcessWithRelations[];
		scrapCodes: ScrapCode[];
		parts: Part[];
		filterOptions: { processId: string };
	} = $props();

	let isSubmitting = $state(false);
	let partId = $state('');
	let scrapId = $state('');
	let description = $state('');
	let quantity = $state('');
	let operatorId = $state('');

	// combobox resets
	let resetProcessCombo = $state(false);
	let resetPartCombo = $state(false);
	let resetScrapCodeCombo = $state(false);

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
		$favoriteProcesses = getFavoriteProcessesFromLC;
	}

	const fillLoggedOperator = () => {
		let getId = localStorage.getItem('operatorId');
		operatorId = getId ? getId : 'empty';
		if (operatorId === 'empty') {
			goto('/');
		}
	};
</script>

<main>
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
						(process: ProcessWithRelations) => process.id === Number(filterOptions.processId)
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
							Number($favoriteProcesses.find((item) => Number(item.id) === actuallProcess?.id)?.id)
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
</main>
