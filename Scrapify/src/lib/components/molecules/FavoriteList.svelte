<script lang="ts">
	import { onMount } from 'svelte';
	import { favoriteProcesses } from '@/stores/stores';
	import { Heart } from '@lucide/svelte';

	let { filterOptions = $bindable() }: { filterOptions: { processId: string } } = $props();

	onMount(() => {
		favoriteProcesses.set(
			localStorage.getItem('favoriteProcesses')
				? JSON.parse(localStorage.getItem('favoriteProcesses') || '[]')
				: []
		);
	});
</script>

<main class="mb-6">
	<div
		class="{$favoriteProcesses.length > 0
			? 'listNormalize hidden sm:block'
			: 'hidden'} overflow-y-auto h-fit max-h-[400px]"
	>
		<h2 class="text-primary text-2xl font-bold text-center pb-4">Pouzivane procesy</h2>

		<div class="flex gap-2">
			{#each $favoriteProcesses as process}
				<div class="flex items-center gap-1">
					<button
						class="{filterOptions.processId === process.id
							? 'bg-chart-4 ring-1 ring-chart-1'
							: 'hover:bg-chart-4/20'} w-full text-foreground text-start text-sm p-1 px-4 rounded-md"
						onclick={() => {
							filterOptions.processId = process.id;
						}}
						>{process.name}
					</button>
				</div>
			{/each}
		</div>
	</div>
</main>
