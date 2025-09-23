<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import type { PageData } from '../../../routes/(Client)/$types';

	type Result = 'success' | 'notnumber' | 'empty';

	let cardId = $state('');
	let isSubmitting = $state(false);
	let infoResult = $state<Result>();

	const logoutOperator = () => {
		localStorage.removeItem('operatorId');
		infoResult = 'notnumber';
		cardId = '';
		isSubmitting = false;
	};

	const handleOperatorLogin = () => {
		if (cardId.length > 0) {
			let numCardId = Number(cardId);
			if (numCardId) {
				localStorage.setItem('operatorId', cardId);
				infoResult = 'success';
				goto('/createScrap');
			} else {
				infoResult = 'notnumber';
			}
		} else if (cardId.length === 0) {
			infoResult = 'empty';
		}
	};

	$effect(() => {
		let lsGetOperator: string | null = localStorage.getItem('operatorId');

		if (lsGetOperator) {
			cardId = lsGetOperator;
			infoResult = 'success';
		} else {
			infoResult = 'notnumber';
			cardId = '';
		}
	});
</script>

<main class="mx-auto text-center w-full">
	<section class="formNormalize mx-auto lg:w-xl">
		<h1 class="mx-auto text-2xl font-semibold text-primary">Card ID</h1>
		{@render loginInfo()}
		{#if infoResult === 'success'}
			<p class=" text-accent-foreground">
				Prihlaseny operator: <span class="text-primary font-bold text-xl">{cardId}</span>
			</p>
			<div>
				<Button
					variant="destructive"
					class="w-full mt-10"
					onclick={() => {
						logoutOperator();
					}}>Odhlasit</Button
				>
			</div>
		{:else}
			<article class="flex justify-between items-center gap-2">
				<Label class="text-sm md:text-lg text-primary!">Card ID</Label>
				<Input
					type="text"
					class="inputNormalize max-w-[240px]"
					placeholder="Zadaj cislo karty"
					bind:value={cardId}
				/>
			</article>
			<Button
				size="lg"
				class="w-full mt-10"
				onclick={() => {
					isSubmitting = true;
					handleOperatorLogin();
				}}>Login</Button
			>
		{/if}
	</section>
</main>

{#snippet loginInfo()}
	{#if infoResult === 'success'}
		<span class="text-chart-info">Uspesne prihlaseny</span>
	{:else if infoResult === 'notnumber'}
		<span class="text-chart-warning">Prosim zadaj iba cisla</span>
	{:else}
		<span class="text-chart-warning">Prosim zadaj cisla</span>
	{/if}
{/snippet}
