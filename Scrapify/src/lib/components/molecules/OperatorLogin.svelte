<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import ResultInfo, { type ResultInfoData } from './ResultInfo.svelte';
	import Separator from '../ui/separator/separator.svelte';
	import Label from '../ui/label/label.svelte';

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

<main class="mx-auto text-center w-full lg:w-4xl">
	{#if verifiedOperator}
		<div class="formNormalize bg-primary/30 lg:text-xl">
			<section class="grid lg:grid-cols-2 gap-6">
				<h3 class="m-auto text-4xl lg:text-7xl font-bold uppercase tracking-wider"
					>Card ID</h3
				>

				<div class="flex justify-center gap-6">
					<Separator orientation="vertical" class={'hidden lg:block'} />
					<p class="m-auto w-full text-4xl lg:text-6xl font-bold text-primary text-start">
						{cardId}
					</p>

					<Button
						variant="destructive"
						class=" my-auto"
						size="lg"
						onclick={() => {
							logoutOperator();
						}}>Odhlasit</Button
					>
				</div>
			</section>
		</div>
	{:else}
		<form
			method="POST"
			onsubmit={handleLoginOperator}
			class="formNormalize bg-secondary/30 gap-4 rounded-3xl"
		>
			<div>
				<ResultInfo data={infoResult} />
			</div>

			<section class="grid lg:grid-cols-2 gap-6">
				<Label for="cardId" class="m-auto text-4xl lg:text-7xl font-bold uppercase tracking-wider"
					>Card ID</Label
				>
				<div class="flex justify-center gap-6">
					<Separator orientation="vertical" />
					<article class="flex justify-between items-center gap-2">
						<!-- <Label for="cardId" class="text-xl">ID karty</Label> -->
						<Input
							type="number"
							name="cardId"
							autocomplete={'off'}
							bind:value={cardId}
							placeholder="Zadaj ID karty"
							class="inputNormalize max-w-[240px] text-3xl!"
							id="cardId"
							required
						/>
					</article>

					<Button type="submit" class="mt-10 my-auto" variant="default" size="lg">
						{#if isSubmitting}
							<span>Submitting...</span>
						{:else}
							Login
						{/if}
					</Button>
				</div>
			</section>
		</form>
	{/if}
</main>
