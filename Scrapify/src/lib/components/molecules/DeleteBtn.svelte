<script lang="ts">
	import { Check, Trash, X } from '@lucide/svelte';
	import { Button } from '../ui/button';
	import { enhance } from '$app/forms';
	import { currentConfirmDeleteId, isEditing } from '@/stores/stores';

	let { id, actionRoute }: { id: number; actionRoute: string } = $props();

	let isSubmitting = $state(false);
	let isConfirmState = $state(false);

	const handleShowConfirm = (confirmId: number) => {
		isConfirmState = true;
		currentConfirmDeleteId.set(confirmId);
	};
	const handleCancelConfirm = () => {
		isConfirmState = false;
		currentConfirmDeleteId.set(undefined);
	};

	$effect(() => {
		if ($isEditing) handleCancelConfirm();
	});

	// $inspect(takeConfirmId);
</script>

<main class="flex gap-1 justify-end relative">
	<form
		action={actionRoute}
		method="POST"
		class="flex"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				// await new Promise((resolve) => setTimeout(resolve, 5000));
				await update();
				currentConfirmDeleteId.set(undefined);
				window.scrollTo({ top: 0, behavior: 'smooth' });
				isSubmitting = false;
			};
		}}
	>
		<!-- Confirm zone -->
		<div class={$currentConfirmDeleteId === id ? 'flex items-center' : 'hidden'}>
			<p class="mr-1">Are you sure?</p>
			<Button type="submit" disabled={isSubmitting} variant="ghost" size="icon" title="Delete"
				><Check class="size-5! text-chart-success" /></Button
			>
			<Button type="button" variant="ghost" size="icon" onclick={handleCancelConfirm} title="Cancel"
				><X class="size-5! text-destructive" />
			</Button>
		</div>

		<!-- Trash click -->
		<input type="hidden" value={id} name="deleteId" required />
		<Button
			type="button"
			variant="ghost"
			size="icon"
			hidden={id === $currentConfirmDeleteId ? true : false}
			onclick={() => handleShowConfirm(id)}
			title="Delete"><Trash class="size-5! text-destructive" /></Button
		>
	</form>
</main>

<!-- FOR FUTURE -->
