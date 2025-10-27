<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '../ui/button/button.svelte';
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
			? 'listNormalize max-w-2xs hidden sm:block'
			: 'hidden'} overflow-y-auto h-fit max-h-[400px]"
	>
		<h3 class="lg:text-2xl text-primary font-bold mb-6 text-center">
			Process favorite <Heart class="fill-chart-success text-chart-success mx-auto" />
		</h3>

		<div class="flex flex-col gap-2">
			{#each $favoriteProcesses as process}
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
	</div>
</main>
