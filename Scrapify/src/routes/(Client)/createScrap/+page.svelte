<script lang="ts">
	import { enhance } from '$app/forms';
	import { Label } from '@/components/ui/label';
	import type { PageProps } from './$types';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { CopyCheck } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import ScrapTable from '@/components/molecules/ScrapTable.svelte';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';

	let { data, form }: PageProps = $props();
	let { parts, scrapCodes, scrapRecords } = $derived(data.data);
	const errors = $derived(form?.error || {});

	let isSubmitting = $state(false);
	let partId = $state('');
	let scrapId = $state('');
	let description = $state('');
	let quantity = $state('');
	let operatorId = $state('');

	let resetPartCombo = $state(false);
	let resetScrapCodeCombo = $state(false);

	const fillLoggedOperator = () => {
		let getId = localStorage.getItem('operatorId');
		operatorId = getId ? getId : 'empty';
		if (operatorId === 'empty') {
			goto('/');
		}
	};

	// $inspect(scrapRecords);
</script>

<main class="flex flex-col lg:flex-wrap gap-10 relative">
	<!--  -->
	<!-- CREATE SCRAP RECORD -->
	<section class="w-full sm:w-xl mx-auto">
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
			class="formNormalize"
		>
			<h2 class="text-center font-semibold text-2xl text-chart-1">Vytvorit scrap</h2>
			<!-- Result -->
			<div>
				<ResultInfo data={form} />
			</div>

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
					placeholder="Description (optional)"
					name="description"
					id="description"
					class="inputNormalize max-w-[240px]"
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
					class="inputNormalize max-w-[240px]"
					bind:value={quantity}
				/>
			</article>
			<!-- -->
			<!-- input createdBy -->
			<article class="flex justify-between items-center gap-2">
				<Label for="operatorId" class="text-sm md:text-lg">Operator ID</Label>
				<div class="flex w-[240px]">
					<Input
						placeholder="Operator id"
						name="operatorId"
						id="operatorId"
						class="inputNormalize max-w-[240px]"
						bind:value={operatorId}
					/>
					<Button
						size="icon"
						onclick={() => {
							fillLoggedOperator();
						}}><CopyCheck /></Button
					>
				</div>
			</article>

			<Button type="submit" class="mt-10 ">
				{#if isSubmitting}
					<span>Submitting...</span>
				{:else}
					Vytvorit scrap
				{/if}
			</Button>
		</form>
	</section>

	<section>
		<ScrapTable
			findRecords={scrapRecords}
			totalRecords={20}
			headerText={'Poslednych 20 zaznamov'}
		/>
	</section>
</main>
