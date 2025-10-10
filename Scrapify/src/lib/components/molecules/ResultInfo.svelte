<script lang="ts">
	import { X } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';
	import { slide } from 'svelte/transition';

	type FormError = boolean | string | Record<string, any | string[]>;

	export interface ResultInfoData {
		success: boolean;
		message: string;
		error?: FormError;
	}

	let { data }: { data: ResultInfoData | undefined | null } = $props();

	const clearResult = () => {
		data = null;
	};
</script>

{#if data}
	<section class="my-4 flex relative" transition:slide>
		{#if data?.success}
			<div
				class="w-full p-4 mb-1 bg-chart-success/30 backdrop-blur-sm text-chart-success rounded-md"
			>
				{data.message}
			</div>
		{:else}
			<div
				class="w-full p-4 bg-destructive/30 backdrop-blur-sm text-destructive rounded-md space-y-2"
			>
				<p class="font-semibold">{data?.message}</p>

				{#if data?.error}
					{#if typeof data.error === 'string'}
						<p>{data.error}</p>
					{/if}

					{#if typeof data.error === 'object' && Object.keys(data.error).length > 0}
						<ul class="list-disc list-inside space-y-1 text-sm">
							{#each Object.entries(data.error) as [field, messages]}
								<li>
									<span class="capitalize font-medium">{field}:</span>
									{Array.isArray(messages) ? messages.join(', ') : messages}
								</li>
							{/each}
						</ul>
					{/if}
				{/if}
			</div>
		{/if}
		<div class="absolute -right-2 -top-2 z-50">
			<Button
				variant="ghost"
				size="icon"
				title="Close"
				class="text-destructive rounded-full  hover:bg-secondary transition-all ease-in"
				onclick={() => {
					clearResult();
				}}><X class=" size-4!" /></Button
			>
		</div>
	</section>
{/if}
