<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import Button from '@/components/ui/button/button.svelte';
	import Rebuild from './_components/Rebuild.svelte';
	import { ScrapManager } from './_components/ScrapManager.svelte';
	import { operatorCardId } from '@/stores/stores';
	import Scrap from './_components/Scrap.svelte';
	import QuantityScrap from './_components/QuantityScrap.svelte';
	import Scan from './_components/Scan.svelte';

	let { form, data }: PageProps = $props();

	// for testing
	let randomNumber = $state(Math.floor(100 * Math.random()));
	//
	// Vars
	const scrapManager = new ScrapManager();
	let isSubmitting = $state(false);
	let barcodeValue = $state('X4' + randomNumber);
	let selectedQuantityScrapLabelId = $state<number | null>(null);
	let status = $state<'idle' | 'success' | 'error'>('idle');

	//
	// Func
	function resetAll() {
		barcodeValue = '';
		selectedQuantityScrapLabelId = null;
		scrapManager.reset();
		status = 'idle';
	}

	// $inspect($operatorCardId);
</script>

<main class="flex flex-col gap-3 items-center relative">
	<!-- Scan -->
	<Scan
		{scrapManager}
		{form}
		{data}
		bind:barcodeValue
		bind:selectedQuantityScrapLabelId
		bind:status
		{resetAll}
	/>

	<!-- RESULT FORM -->
	{#if scrapManager.mode && status === 'success'}
		<form
			method="POST"
			action={scrapManager.mode === 'qntScrap' ? '?/saveQuantityScrap' : '?/saveScrap'}
			use:enhance={({ formData }) => {
				formData.set('dmc', scrapManager.barcode);
				if (scrapManager.mode !== 'qntScrap') {
					formData.set('isRebuild', JSON.stringify(scrapManager.mode === 'rebuild'));
				} else {
					formData.set('labelGroupId', String(selectedQuantityScrapLabelId ?? ''));
				}
				formData.set('operator', $operatorCardId);
				formData.set('scrapPayload', JSON.stringify(scrapManager.relevantPayload));
				isSubmitting = true;

				return async ({ update, result }) => {
					await update({ reset: false });
					isSubmitting = false;
					if (result.type === 'success') {
						resetAll();
					}
				};
			}}
			id="scrap"
			class="formNormalize
			{scrapManager.mode === 'rebuild' && 'bg-chart-1/5'} 
			{scrapManager.mode === 'scrap' && 'bg-chart-2/5'} w-full"
		>
			{#if scrapManager.mode === 'rebuild'}
				<Rebuild {scrapManager} />
			{:else if scrapManager.mode === 'scrap'}
				<Scrap {scrapManager} />
			{:else if scrapManager.mode === 'qntScrap'}
				<QuantityScrap {scrapManager} />
			{/if}

			<Button type="submit" class="mt-10" disabled={isSubmitting || !scrapManager.canSubmit}>
				{#if isSubmitting}
					<span>Prebieha vytvorenie scrapu...</span>
				{:else}
					{scrapManager.mode === 'qntScrap'
						? 'Uložiť quantity scrap'
						: `Vytvoriť ${scrapManager.mode === 'rebuild' ? 're-build' : 'scrap'}`}
				{/if}
			</Button>
		</form>
	{/if}
</main>
