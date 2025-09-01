<script lang="ts">
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { Label } from '@/components/ui/label';
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';
	import EditDeleteBtns from '@/components/organism/EditDeleteBtns.svelte';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';

	let { data, form }: PageProps = $props();
	let { scrapCodes } = $derived(data.data);

	let isSubmitting = $state(false);

	let scrapcodeNum = $state('');
	let scrapcodeName = $state('');
	let scrapDescription = $state('');

	// $inspect(data);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<main class="flex flex-col lg:flex-wrap gap-10">
	<!--  -->
	<!-- FORM -->
	<section class="w-full sm:w-lg">
		<form
			action="?/createScrap"
			method="POST"
			class="formNormalize"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update, result }) => {
					await update();
					isSubmitting = false;
				};
			}}
		>
			<h1 class="mx-auto mb-10 text-2xl">Create new screp code</h1>
			<div>
				<ResultInfo data={form} />
			</div>
			<!--  -->
			<!-- inputs -->
			<article class="flex justify-between items-center gap-2">
				<Label for="partNumber" class="text-sm sm:text-xl">Code</Label>
				<Input
					type="text"
					name="scrapcodeNum"
					id="scrapcodeNum"
					bind:value={scrapcodeNum}
					placeholder="Insert scrap code"
					class="inputNormalize max-w-[240px]"
					required
				/>
			</article>
			<article class="flex justify-between items-center gap-2">
				<Label for="partNumber" class="text-sm sm:text-xl">Name</Label>
				<Input
					type="text"
					name="scrapcodeName"
					id="scrapcodeName"
					bind:value={scrapcodeName}
					placeholder="Insert scrap code name"
					class="inputNormalize max-w-[240px]"
					required
				/>
			</article>
			<article class="flex justify-between items-center gap-2">
				<Label for="partNumber" class="text-sm sm:text-xl">Description</Label>
				<Input
					type="text"
					name="scrapDescription"
					id="scrapDescription"
					bind:value={scrapDescription}
					placeholder="Scrap description (optional)"
					class="inputNormalize max-w-[240px]"
				/>
			</article>
			<Button type="submit" class="mt-10 ">
				{#if isSubmitting}
					<span>Submitting...</span>
				{:else}
					Create screp code
				{/if}
			</Button>
		</form>
	</section>

	<!--  -->
	<!-- Scrap Code LIST -->
	<section class="flex listNormalize flex-col gap-2 w-full lg:min-w-3xl text-xs md:text-sm">
		<h2 class="text-2xl text-center mb-6">Actuall scrap code list</h2>
		{#each scrapCodes as code}
			<div class="flex gap-2 border-b pb-2 border-muted">
				<p class="md:min-w-[80px] text-muted-foreground text-sm">
					ID: <span class="text-primary">{code.id}</span>
				</p>
				<p class="text-muted-foreground lg:min-w-[280px] text-sm">
					Uniq code num: <span class="text-primary">{code.code}</span>
				</p>
				<p class="text-muted-foreground text-sm lg:min-w-[150px]">
					Name: <span class="text-primary">{code.name}</span>
				</p>
				<p class="text-muted-foreground text-sm lg:min-w-[100px]">
					Description: <span class="text-primary">{code.description ? code.description : 'X'}</span>
				</p>
				<div class="ml-auto">
					<EditDeleteBtns />
				</div>
			</div>
		{/each}
	</section>
</main>
