<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';

	type Result = 'success' | 'notnumber';

	let cardId = $state('');
	let isSubmitting = $state(false);
	let infoResult = $state<Result>();

	const logoutOperator = () => {
		localStorage.removeItem('operatorId');
		infoResult = 'notnumber';
		cardId = '';
		isSubmitting = false;
	};

	$effect(() => {
		if (cardId.length > 0 && isSubmitting) {
			let numCardId = Number(cardId);
			if (numCardId) {
				localStorage.setItem('operatorId', cardId);
				infoResult = 'success';
				goto('/createScrap');
			} else {
				infoResult = 'notnumber';
			}
		}
		isSubmitting = false;
		let lsGetOperator = localStorage.getItem('operatorId');
		if (lsGetOperator) {
			cardId = lsGetOperator;
			infoResult = 'success';
		}
	});
</script>

<main class="mx-auto text-center">
	<section class=" bg-red-500 formNormalize mx-auto lg:w-lg">
		<h1 class="mx-auto mb-2 text-2xl">Operator card ID</h1>
		{@render loginInfo()}
		{#if infoResult === 'success'}
			<p class="text-2xl text-accent-foreground">
				Prihlaseny operator: <span class="text-primary font-bold text-3xl">{cardId}</span>
			</p>
			<div>
				<Button
					variant="destructive"
					onclick={() => {
						logoutOperator();
					}}>Odhlasit</Button
				>
			</div>
		{:else}
			<article class="flex justify-between items-center gap-2">
				<Label class="text-sm md:text-lg">Card ID</Label>
				<Input
					type="text"
					class="inputNormalize max-w-[240px]"
					placeholder="Zadaj cislo karty"
					bind:value={cardId}
				/>
			</article>
			<Button
				size="lg"
				onclick={() => {
					isSubmitting = true;
				}}>Login</Button
			>
		{/if}
	</section>
</main>

{#snippet loginInfo()}
	{#if infoResult === 'success'}
		<span class="text-chart-success">Uspesne prihlaseny</span>
	{:else if infoResult === 'notnumber'}
		<span class="text-chart-warning">Prosim zadaj iba cisla</span>
	{/if}
{/snippet}
