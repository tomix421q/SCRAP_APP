<script lang="ts">
	import ToNavigateBtn from '@/components/atoms/ToNavigateBtn.svelte';
	import type { PageProps } from './$types';
	import Card from '@/components/ui/card/card.svelte';
	import CardHeader from '@/components/ui/card/card-header.svelte';
	import CardContent from '@/components/ui/card/card-content.svelte';
	import CardFooter from '@/components/ui/card/card-footer.svelte';
	import CardTitle from '@/components/ui/card/card-title.svelte';
	import CardDescription from '@/components/ui/card/card-description.svelte';
	import Combobox from '@/components/atoms/Combobox.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { enhance } from '$app/forms';
	import ResultInfo from '@/components/molecules/ResultInfo.svelte';
	import { ROLES, type Role } from '@/utils/types';
	import { dateTimmeUTCformatter } from '@/index';

	let { form, data }: PageProps = $props();
	let { allUsers } = $derived(data);
	let isSubmitting = $state(false);
	let modalOpen = $state(false);

	const ALL_ROLES = ROLES.filter((role) => role !== ROLES[3]) // Exclude ADMIN from the list
		.map((role) => ({
			id: role,
			name: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
		}));

	let dataBoxValue = $state('');
	let resetCombobox = $state(false);

	const colorUserByRole = (role: string): string => {
		switch (role) {
			case 'ADMIN':
				return 'bg-black';
			case 'ENGINEER':
				return 'bg-chart-2';
			case 'MODERATOR':
				return 'bg-gray-800';
			default:
				return 'bg-primary';
		}
	};

	$effect(() => {
		if (!modalOpen) form = null;
	});

	// $inspect();
</script>

<main>
	<ToNavigateBtn text="Back to admin panel" href="/admin" />

	<h1 class="text-5xl mb-10">Registered users</h1>

	<section class="gap-6 flex-wrap flex mx-auto!">
		{#each allUsers as user}
			<Card class="w-full lg:w-xs bg-chart-4/30 cardNormalize">
				<CardHeader>
					<CardTitle>{user.name} <br /> {user.email}</CardTitle>
					<CardDescription>{user.id}</CardDescription>
				</CardHeader>
				<CardContent>
					<div
						class="flex {colorUserByRole(user.role)} justify-between items-center rounded-sm p-2"
					>
						<p class="w-fit font-bold">
							{user.role}
						</p>
						<div>
							{#if user.role !== 'ADMIN'}
								{@render modalChangeRole(user.id, user.role)}
							{/if}
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<p>{dateTimmeUTCformatter(user.createdAt)}</p>
				</CardFooter>
			</Card>
		{/each}
	</section>
</main>

{#snippet modalChangeRole(userId: string, actuallRole: string)}
	{@const dataBox = ALL_ROLES.filter((role) => role.id !== actuallRole)}

	<AlertDialog.Root
		onOpenChange={() => {
			modalOpen = !modalOpen;
		}}
	>
		<AlertDialog.Trigger class=" underline">Change role</AlertDialog.Trigger>

		<AlertDialog.Content class="bg-transparent border-none">
			<form
				action="?/changeUserRole"
				method="POST"
				class="formNormalize"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update, result }) => {
						if (result?.type === 'success') {
							resetCombobox = true;
						}
						await update();
						isSubmitting = false;
						resetCombobox = false;
					};
				}}
			>
				<AlertDialog.Header>
					<AlertDialog.Title>Change role</AlertDialog.Title>
					<AlertDialog.Description>
						<div>
							<ResultInfo data={form} />
						</div>
						<Combobox {dataBox} bind:value={dataBoxValue} reset={resetCombobox} id={'userRole'} />
						<input type="hidden" name="userRole" required bind:value={dataBoxValue} />
						<input type="hidden" name="userId" required value={userId} />
					</AlertDialog.Description>
				</AlertDialog.Header>

				<AlertDialog.Footer>
					<AlertDialog.Cancel type="button">Cancel</AlertDialog.Cancel>
					<AlertDialog.Action type="submit">Submit</AlertDialog.Action>
				</AlertDialog.Footer>
			</form>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/snippet}
