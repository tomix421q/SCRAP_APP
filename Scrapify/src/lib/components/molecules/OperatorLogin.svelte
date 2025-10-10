<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import ResultInfo, { type ResultInfoData } from './ResultInfo.svelte';

	let cardId = $state('');
	let isSubmitting = $state(false);
	let infoResult = $state<ResultInfoData>();

	let verifiedOperator = $state(false);

	async function handleLoginOperator(event: SubmitEvent) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		isSubmitting = true;

		try {
			const dataToSend = Object.fromEntries(formData);
			const response = await fetch('/api/operators', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(dataToSend)
			});

			const apiResult: ResultInfoData = await response.json();
			if (!response.ok || !apiResult.success) {
				if (!apiResult.success) {
					infoResult = apiResult;
				} else {
					infoResult = {
						success: false,
						error: response.statusText,
						message: response.status.toString()
					};
				}
			} else {
				infoResult = apiResult;
				setOperatorToLc();
				form.reset();
			}
		} catch (err: any) {
			infoResult = {
				success: false,
				error: err.message || 'Unknown error',
				message: 'Internal Fault'
			};
		} finally {
			isSubmitting = false;
		}
	}

	const logoutOperator = () => {
		localStorage.removeItem('operatorId');
		cardId = '';
		verifiedOperator = false;
	};

	function setOperatorToLc() {
		verifiedOperator = true;
		if (verifiedOperator) {
			localStorage.setItem('operatorId', cardId);
			goto('/createScrap');
		}
	}

	$effect(() => {
		let isOperator = localStorage.getItem('operatorId');
		if (isOperator) {
			verifiedOperator = true;
			cardId = isOperator;
		}
	});

	// $inspect(actuallTime);
</script>

<main class="mx-auto text-center w-full sm:w-xl">
	{#if verifiedOperator}
		<div class="listNormalize bg-secondary/30 lg:text-xl">
			<p class=" text-accent-foreground">
				Prihlaseny operator: <span class="text-primary font-semibold text-2xl">{cardId}</span>
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
		</div>
	{:else}
		<form method="POST" onsubmit={handleLoginOperator} class="formNormalize bg-primary/10 gap-4">
			<h1 class="mx-auto text-2xl">Card ID</h1>
			<div>
				<ResultInfo data={infoResult} />
			</div>

			<article class="flex justify-between items-center gap-2">
				<Label for="cardId" class="text-xl">ID karty</Label>
				<Input
					type="text"
					name="cardId"
					bind:value={cardId}
					placeholder="Cislo karty"
					class="inputNormalize max-w-[240px]"
					id="cardId"
					required
				/>
			</article>

			<Button type="submit" class="mt-10 ">
				{#if isSubmitting}
					<span>Submitting...</span>
				{:else}
					Prihlasit
				{/if}
			</Button>
		</form>
	{/if}
</main>
