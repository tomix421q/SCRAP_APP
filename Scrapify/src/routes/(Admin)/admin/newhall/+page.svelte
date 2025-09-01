<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';

	let { form, data }: PageProps = $props();
	let halls = $derived(data.halls);
	let isSubmitting = $state(false);

	let hallName = $state('');
	let hallDescription = $state('');
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!--  -->
	<!-- CREATE HALL -->
	<section class="w-full sm:w-lg">
		<form
			method="POST"
			action="?/createHall"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					// await new Promise((resolve) => setTimeout(resolve, 5000));
					await update();
					isSubmitting = false;
				};
			}}
			class="formNormalize"
		>
			<h1 class="mx-auto mb-10 text-2xl">Create new hall</h1>
			<div>
				<ResultInfo data={form} />
			</div>

			<!--  -->
			<!-- hall -->
			<article class="flex justify-between items-center gap-2">
				<Label for="hallName" class="text-xl">Name</Label>
				<Input
					type="text"
					name="hallName"
					bind:value={hallName}
					placeholder="Insert hall name"
					class="inputNormalize max-w-[240px]"
					required
				/>
			</article>
			<article class="flex justify-between items-center gap-2">
				<Label for="hallDescription" class="text-xl">Description</Label>
				<Input
					type="text"
					name="hallDescription"
					bind:value={hallDescription}
					class="inputNormalize max-w-[240px]"
					placeholder="Hall description (optional)"
				/>
			</article>
			<Button type="submit" class="mt-10 ">
				{#if isSubmitting}
					<span>Submitting...</span>
				{:else}
					Create Hall
				{/if}
			</Button>
		</form>
	</section>

	<!--  -->
	<!-- HALLS LIST -->
	<section class="flex listNormalize flex-col gap-2 w-full lg:min-w-3xl max-h-[500px]">
		<h2 class="text-2xl text-center mb-4">Actuall hall List</h2>
		{#each halls as hall}
			<div class="flex gap-2">
				<p class="min-w-[80px] text-muted-foreground">
					ID: <span class="text-primary">{hall.id}</span>
				</p>
				<p class="text-muted-foreground">Name: <span class="text-primary">{hall.name}</span></p>
			</div>
		{/each}
	</section>
</main>
