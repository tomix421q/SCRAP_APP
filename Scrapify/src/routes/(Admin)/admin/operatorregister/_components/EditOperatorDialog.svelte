<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Pencil } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { Operator } from '@prisma/client';
	import * as Dialog from '@/components/ui/dialog';
	import Button, { buttonVariants } from '@/components/ui/button/button.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import Label from '@/components/ui/label/label.svelte';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import type { ResultInfoData } from '@/components/molecules/ResultInfo.svelte';

	let { operator }: { operator: Pick<Operator, 'id' | 'fullName' | 'cardId'> } = $props();

	let open = $state(false);
	let isSubmitting = $state(false);
	let fullName = $state('');
	let cardId = $state('');
	let result = $state<ResultInfoData | null>(null);

	// Start every opening from the saved values, so a cancelled edit leaves no trace.
	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) return;
		fullName = operator.fullName;
		cardId = String(operator.cardId);
		result = null;
	}

	const fieldId = (name: string) => `${name}-${operator.id}`;
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Trigger
		class={buttonVariants({ variant: 'ghost', size: 'icon' })}
		title="Edit"
		aria-label="Edit operator {operator.fullName}"
	>
		<Pencil class="size-5! text-primary" />
	</Dialog.Trigger>
	<Dialog.Content class="cardNormalize">
		<Dialog.Header>
			<Dialog.Title>Edit operator</Dialog.Title>
			<Dialog.Description>{operator.fullName} · {operator.cardId}</Dialog.Description>
		</Dialog.Header>

		<form
			action="?/updateOperator"
			method="POST"
			class="flex flex-col gap-6"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ result: actionResult }) => {
					isSubmitting = false;
					if (actionResult.type === 'success') {
						open = false;
						const data = actionResult.data as ResultInfoData | undefined;
						toast.success(data?.message ?? 'Operator was updated.');
						await invalidateAll();
					} else if (actionResult.type === 'failure') {
						result = (actionResult.data as ResultInfoData | undefined) ?? null;
					} else {
						result = {
							success: false,
							message: 'Something is wrong, Please try again later.'
						};
					}
				};
			}}
		>
			<ResultInfo data={result} />
			<input type="hidden" name="id" value={operator.id} />

			<article class="flex justify-between items-center gap-2">
				<Label for={fieldId('fullName')}>Name</Label>
				<Input
					id={fieldId('fullName')}
					type="text"
					name="fullName"
					bind:value={fullName}
					class="inputNormalize max-w-[300px]"
					minlength={5}
					maxlength={255}
					required
				/>
			</article>

			<article class="flex flex-col gap-1">
				<div class="flex justify-between items-center gap-2">
					<Label for={fieldId('cardId')}>Card ID</Label>
					<Input
						id={fieldId('cardId')}
						type="text"
						inputmode="numeric"
						pattern="\d+"
						name="cardId"
						bind:value={cardId}
						class="inputNormalize max-w-[240px]"
						required
					/>
				</div>
				<p class="text-sm text-muted-foreground">
					Existing scrap records keep the old card ID in "Created by". They are not rewritten.
				</p>
			</article>

			<Dialog.Footer>
				<Dialog.Close class={buttonVariants({ variant: 'outline' })} type="button">
					Cancel
				</Dialog.Close>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : 'Save'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
