<script lang="ts">
	import { onMount } from 'svelte';
	import { favoriteProcesses } from '@/stores/stores';
	import { Heart } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';

	let { filterOptions = $bindable() }: { filterOptions: { processId: string } } = $props();

	onMount(() => {
		favoriteProcesses.set(
			localStorage.getItem('favoriteProcesses')
				? JSON.parse(localStorage.getItem('favoriteProcesses') || '[]')
				: []
		);
	});
</script>

<main>
	<div
		class="{$favoriteProcesses.length > 0
			? 'listNormalize hidden sm:block'
			: 'hidden'} overflow-y-auto h-fit max-h-[400px]"
	>
		<div class="text-center mb-6">
			<h2 class="text-primary text-2xl font-bold text-center">Pouzivane procesy</h2>
			<span class="text-xs text-muted-foreground"
				>Rychla ponuka oblubenych procesov.Kliknutim na srdiecko pri vytvarani scrapu
				pridate/odstranite process z oblubenych.</span
			>
		</div>

		<div class="flex gap-2">
			{#each $favoriteProcesses as process}
				<div class="flex items-center gap-1">
					<Button
						variant="secondary"
						class={filterOptions.processId === process.id ? 'text-chart-1' : ''}
						onclick={() => {
							filterOptions.processId = process.id;
						}}
						>{process.name}
					</Button>
				</div>
			{/each}
		</div>
	</div>
</main>
