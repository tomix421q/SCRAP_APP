<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import ActionPanel from './_components/ActionPanel.svelte';
	import Rebuild from './_components/Rebuild.svelte';
	import { ScrapManager } from './_components/ScrapManager.svelte';
	import { operatorCardId } from '@/stores/stores';
	import Scrap from './_components/Scrap.svelte';
	import QuantityScrap from './_components/QuantityScrap.svelte';
	import Scan from './_components/Scan.svelte';

	let { form, data }: PageProps = $props();

	// for testing
	// let randomNumber = $state(Math.floor(100 * Math.random()));
	//
	// Vars
	const scrapManager = new ScrapManager();
	let isSubmitting = $state(false);
	let barcodeValue = $state('');
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

<main
	class="flex flex-col gap-3 items-center relative {scrapManager.mode && status === 'success'
		? 'pb-20'
		: ''}"
>
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
			class="w-full"
		>
			{#if scrapManager.mode === 'rebuild'}
				<Rebuild {scrapManager} />
			{:else if scrapManager.mode === 'scrap'}
				<Scrap {scrapManager} />
			{:else if scrapManager.mode === 'qntScrap'}
				<QuantityScrap {scrapManager} />
			{/if}
		</form>

		<ActionPanel {scrapManager} {isSubmitting} {resetAll} />
	{/if}
</main>
