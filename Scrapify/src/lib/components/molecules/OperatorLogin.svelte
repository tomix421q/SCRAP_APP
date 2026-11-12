<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import ResultInfo, { type ResultInfoData } from './ResultInfo.svelte';
	import Label from '../ui/label/label.svelte';
	import { operatorCardId } from '@/stores/stores';
	import { toast } from 'svelte-sonner';
	import { onMount, type Snippet } from 'svelte';
	import { UserRound } from '@lucide/svelte';

	let {
		/** Extra buttons for the logged-in card (e.g. history), rendered before logout. */
		actions
	}: { actions?: Snippet } = $props();

	let cardId = $state('');
	let isSubmitting = $state(false);
	let infoResult = $state<ResultInfoData>();

	let verifiedOperator = $state(false);
	/** Operator name; shown only once loaded, never stored in localStorage. */
	let fullName = $state<string>();

	function readFullName(value: unknown): string | undefined {
		if (typeof value !== 'object' || value === null || !('fullName' in value)) return undefined;
		return typeof value.fullName === 'string' && value.fullName ? value.fullName : undefined;
	}

	async function loadFullName(id: string) {
		try {
			const response = await fetch('/api/operators', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cardId: id })
			});
			if (!response.ok) return;
			// Ignore a late response after logout or a different login.
			if (id === cardId) fullName = readFullName(await response.json());
		} catch {
			// The card ID alone is enough to identify the operator.
		}
	}

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
				fullName = readFullName(apiResult);
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
		fullName = undefined;
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

	onMount(() => {
		const storedCardId = localStorage.getItem('operatorId');
		if (storedCardId) {
			verifiedOperator = true;
			cardId = storedCardId;
			$operatorCardId = storedCardId;
			void loadFullName(storedCardId);
		}
	});

	// $inspect();
</script>

{#snippet cardHeader()}
	<header class="flex items-center gap-2 text-muted-foreground">
		<UserRound class="size-6" />
		<span class="text-sm font-bold uppercase tracking-widest">Operátor</span>
	</header>
{/snippet}

<main class="w-fit mx-auto max-md:w-full">
	{#if verifiedOperator}
		<!-- Badge layout: identity on the left, actions on the right keeps the card no taller than the scanner. -->
		<div
			class="formNormalize min-w-2xs! h-full! flex-row! items-center justify-between gap-x-8 gap-y-0!"
		>
			<section class="flex flex-col gap-1">
				{@render cardHeader()}
				{#if fullName}
					<p class="mt-1 text-xl lg:text-2xl font-semibold leading-tight">{fullName}</p>
				{/if}
				<p class="text-3xl lg:text-4xl font-bold leading-none tabular-nums text-chart-success">
					{cardId}
				</p>
			</section>

			<footer class="flex flex-col items-stretch gap-2">
				{@render actions?.()}
				<Button
					variant="ghost"
					size="sm"
					class="text-destructive hover:text-destructive"
					onclick={logoutOperator}>Odhlásiť</Button
				>
			</footer>
		</div>
	{:else}
		<form
			method="POST"
			onsubmit={handleLoginOperator}
			class="formNormalize min-w-2xs! h-full! gap-y-2!"
		>
			{@render cardHeader()}
			<ResultInfo data={infoResult} />

			<Label for="cardId" class="text-sm text-muted-foreground">Číslo karty</Label>
			<Input
				type="number"
				name="cardId"
				autocomplete={'off'}
				bind:value={cardId}
				placeholder="Zadaj ID karty"
				class="inputNormalize text-3xl lg:text-4xl font-bold tabular-nums text-chart-success max-w-[220px] placeholder:text-xl"
				id="cardId"
				required
			/>

			<footer class="mt-auto flex items-center gap-2">
				<Button type="submit" variant="default" size="sm" disabled={isSubmitting}>
					{isSubmitting ? 'Prihlasujem…' : 'Prihlásiť'}
				</Button>
			</footer>
		</form>
	{/if}
</main>
