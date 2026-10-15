<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import ResultInfo, { type ResultInfoData } from './ResultInfo.svelte';
	import Separator from '../ui/separator/separator.svelte';
	import Label from '../ui/label/label.svelte';
	import { operatorCardId } from '@/stores/stores';
	import { toast } from 'svelte-sonner';

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
				// window.location.reload();
			}
		} catch (err: any) {
			infoResult = {
				success: false,
				error: err.message || 'Unknown error',
				message: 'Internal Fault'
			};
		} finally {
			isSubmitting = false;
			// form.reset();
		}
	}

	const logoutOperator = () => {
		localStorage.removeItem('operatorId');
		cardId = '';
		$operatorCardId = '';
		verifiedOperator = false;
		infoResult = undefined;
	};

	function setOperatorToLc() {
		verifiedOperator = true;
		if (verifiedOperator) {
			localStorage.setItem('operatorId', cardId);
			verifiedOperator = true;
			$operatorCardId = cardId;
			toast.success('Uspesne prihlaseny');
			goto('/scandmclabel');
		}
	}

	$effect(() => {
		let isOperator = localStorage.getItem('operatorId');
		if (isOperator) {
			verifiedOperator = true;
			cardId = isOperator;
			$operatorCardId = cardId;
		}
	});

	// $inspect();
</script>

<main class="w-fit mx-auto">
	{#if verifiedOperator}
		<div class="formNormalize">
			<section class="flex justify-between">
				<h3 class="text-2xl lg:text-4xl font-bold uppercase tracking-wider">Card ID</h3>

				<div class="flex">
					<p class="text-2xl lg:text-4xl font-bold text-primary">
						{cardId}
					</p>

					<Button
						variant="destructive"
						class="ml-4"
						size="lg"
						onclick={() => {
							logoutOperator();
						}}>Odhlasit</Button
					>
				</div>
			</section>
		</div>
	{:else}
		<form method="POST" onsubmit={handleLoginOperator} class="formNormalize">
			<div>
				<ResultInfo data={infoResult} />
			</div>

			<section class="flex justify-between">
				<Label for="cardId" class="text-2xl lg:text-4xl font-bold uppercase tracking-wider"
					>Card ID</Label
				>
				<div class="flex gap-4">
					<article class="text-2xl lg:text-4xl font-bold text-primary">
						<!-- <Label for="cardId" class="text-xl">ID karty</Label> -->
						<Input
							type="number"
							name="cardId"
							autocomplete={'off'}
							bind:value={cardId}
							placeholder="Zadaj ID karty"
							class="inputNormalize text-2xl lg:text-4xl font-bold text-primary max-w-[220px] placeholder:text-xl"
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
