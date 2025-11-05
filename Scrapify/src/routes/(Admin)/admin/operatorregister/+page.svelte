<script lang="ts">
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import { enhance } from '$app/forms';
	import Button from '@/components/ui/button/button.svelte';
	import type { PageProps } from './$types';
	import Card from '@/components/ui/card/card.svelte';
	import CardHeader from '@/components/ui/card/card-header.svelte';
	import CardTitle from '@/components/ui/card/card-title.svelte';
	import CardDescription from '@/components/ui/card/card-description.svelte';
	import CardContent from '@/components/ui/card/card-content.svelte';
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import Separator from '@/components/ui/separator/separator.svelte';
	import { dateTimmeUTCformatter } from '@/index';
	import CardFooter from '@/components/ui/card/card-footer.svelte';
	import DeleteBtn from '@/components/molecules/DeleteBtn.svelte';

	type FormDataType = {
		fullName: string;
		cardId: number | undefined;
		createdBy: string;
	};

	let { form, data }: PageProps = $props();
	let { user } = $derived(data);
	let isSubmitting = $state(false);

	let formData = $state<FormDataType>({
		fullName: '',
		cardId: undefined,
		createdBy: ''
	});

	$effect(() => {
		if (user) {
			formData.createdBy = user.email;
		}
	});

	// $inspect(data.allOperatorsPromise);
</script>

<ToNavigateBtn href="/admin" text="Back To Admin Panel" />
<main class="flex flex-col lg:flex-auto gap-10">
	<section class="flex">
		<div class="w-full sm:w-lg">
			<!--  -->
			<form
				action="?/createOperator"
				method="POST"
				class="formNormalize"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
						formData = { cardId: undefined, fullName: '', createdBy: formData.createdBy };
					};
				}}
			>
				<h1 class="mx-auto mb-6 text-3xl font-semibold">Register operator</h1>
				<div>
					<ResultInfo data={form} />
				</div>

				<!--  -->
				<input type="text" hidden name="createdBy" bind:value={formData.createdBy} />
				<article class="flex justify-between items-center gap-2">
					<Label for="fullName" class="lg:text-xl">Name</Label>
					<Input
						type="text"
						name="fullName"
						bind:value={formData.fullName}
						placeholder="Full name"
						class="inputNormalize max-w-[350px]"
						id="fullName"
						required
					/>
				</article>
				<article class="flex justify-between items-center gap-2">
					<Label for="cardId" class="lg:text-xl">Card ID</Label>
					<Input
						type="number"
						name="cardId"
						bind:value={formData.cardId}
						placeholder="Card number"
						class="inputNormalize lg:max-w-[240px]"
						id="cardId"
						required
					/>
				</article>
				<Button type="submit" class="mt-10 ">
					{#if isSubmitting}
						<span>Submitting...</span>
					{:else}
						<span>Create new operator</span>
					{/if}
				</Button>
			</form>
		</div>
	</section>

	<!-- Operators list -->
	<section>
		{#await data.allOperatorsPromise}
			<span>Loading...</span>
		{:then operatorList}
			<div class="flex items-center justify-between mb-6 sm:text-3xl font-semibold">
				<h1>Operator list</h1>
				<div>Total : <span class="text-primary">{operatorList.length}</span></div>
			</div>

			<div
				class="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 justify-center items-center"
			>
				{#each operatorList as operator}
					<Card class="cardNormalize bg-secondary/30 w-full! sm:w-xs mx-auto">
						<CardHeader>
							<CardTitle
								class="text-3xl font-bold bg-gradient-to-r from-chart-1 to-chart-3 bg-clip-text text-transparent"
								>{operator.cardId}
							</CardTitle>
							<CardDescription>
								{operator.fullName}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Separator class="mb-4" />
							<article class="flex flex-col">
								<span class="text-primary!">Created by</span><span class="text-muted"
									>{operator.createdBy}</span
								>
							</article>
							<article>
								<span class="text-muted">{dateTimmeUTCformatter(operator.createdAt)}</span>
							</article>
						</CardContent>
						<CardFooter class="flex justify-end -mt-15">
							<DeleteBtn id={operator.id} actionRoute={'?/deleteOperator'} />
						</CardFooter>
					</Card>
				{/each}
			</div>
		{/await}
	</section>
</main>
