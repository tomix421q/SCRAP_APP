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

<main>
	<div
		class="{$favoriteProcesses.length > 0
			? 'listNormalize hidden sm:block'
			: 'hidden'} overflow-y-auto h-fit max-h-[400px]"
	>
		<h3 class="text-primary mb-6 text-center">
			<Heart class="fill-chart-success text-chart-success mx-auto" />
		</h3>

		<div class="flex flex-col gap-2">
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
