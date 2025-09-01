<script lang="ts">
	type FormError = boolean | string | Record<string, any | string[]>;

	export interface ResultInfoData {
		success: boolean;
		message: string;
		error?: FormError;
	}

	let { data }: { data: ResultInfoData | undefined | null } = $props();
</script>

{#if data}
	<section class="my-4">
		{#if data.success}
			<div class="p-4 bg-chart-success/10 text-chart-success rounded-md">
				{data.message}
			</div>
		{:else}
			<div class="p-4 bg-destructive/10 text-destructive rounded-md space-y-2">
				<p class="font-semibold">{data.message}</p>

				{#if data.error}
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
	</section>
{/if}
