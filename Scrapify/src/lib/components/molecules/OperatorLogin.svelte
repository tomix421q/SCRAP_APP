<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import Card from '../ui/card/card.svelte';
	import CardHeader from '../ui/card/card-header.svelte';
	import CardTitle from '../ui/card/card-title.svelte';
	import CardDescription from '../ui/card/card-description.svelte';
	import CardContent from '../ui/card/card-content.svelte';

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
	<Card class="cardNormalize gap-1 mx-auto lg:w-md rounded-3xl! bg-primary/20">
		<CardHeader>
			<CardTitle class="mx-auto text-2xl font-semibold text-primary Card ID">Card ID</CardTitle>
			<CardDescription>{@render loginInfo()}</CardDescription>
		</CardHeader>
		<CardContent>
			{#if infoResult === 'success'}
				<p class=" text-accent-foreground">
					Prihlaseny operator: <span class="text-secondary font-bold! text-lg">{cardId}</span>
				</p>
				<div>
					<Button
						size="sm"
						variant="destructive"
						class="mt-10 w-full"
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
					size="sm"
					class="w-full mt-10"
					onclick={() => {
						isSubmitting = true;
						handleOperatorLogin();
					}}>Login</Button
				>
			{/if}
		</CardContent>
	</Card>
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
