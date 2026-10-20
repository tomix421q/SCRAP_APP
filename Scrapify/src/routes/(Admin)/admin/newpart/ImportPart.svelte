<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '@/components/ui/button/button.svelte';
	import type { ActionData } from './$types';
	import Input from '@/components/ui/input/input.svelte';
	import { X } from '@lucide/svelte';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
	let fileName = $state('');

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			fileName = target.files[0].name;
		}
	}

	$effect(() => {
		// if (form?.success || form?.error) {
		// 	fileName = '';
		// }
	});
</script>

<div class="max-w-md p-6 formNormalize">
	<h2 class="text-2xl text-center font-bold mb-4 text-primary">Excel import</h2>
	<div>
		<ResultInfo data={form} />
	</div>
	<form
		method="POST"
		action="?/importExcel"
		enctype="multipart/form-data"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				await update();
			};
		}}
		class="space-y-4"
	>
		
		<div class={fileName ? 'hidden' : 'block'}>
			<label class="block text-sm font-medium italic mb-2" for="excelFile">
				Select file (.xlsx, .xls)
			</label>
			<Input
				id="excelFile"
				name="excelFile"
				type="file"
				accept=".xlsx, .xls"
				required
				onchange={handleFileChange}
				class="ring-1 w-fit ring-chart-4 rounded-lg hover:bg-chart-4 ease-in cursor-pointer"
			/>
		</div>

		{#if fileName}
			<div class="flex gap-2 items-center">
				<p class="text-lg text-chart-3">Choosed: <span class="font-medium">{fileName}</span></p>
				<Button
					size="icon"
					variant="destructive"
					class="size-6! rounded-full"
					onclick={() => (fileName = '')}><X /></Button
				>
			</div>
		{/if}

		<Button type="submit" disabled={loading} class="w-full mt-8">
			{loading ? 'Recording...' : 'Record'}
		</Button>
	</form>
</div>
