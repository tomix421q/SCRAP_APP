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
	import Separator from '@/components/ui/separator/separator.svelte';
	import DeleteBtn from '@/components/molecules/DeleteBtn.svelte';

	let { form, data }: PageProps = $props();
	let { allUsers, user: loggedUser } = $derived(data);
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

	// $inspect(loggedUser);
</script>

<ToNavigateBtn text="Back to admin panel" href="/admin" />
<div class="max-w-xl">
	<ResultInfo data={form} />
</div>
<main>
	<div class="flex items-center justify-between mb-6 sm:text-3xl font-semibold">
		<h1>Registered users</h1>
		<div>Total : <span class="text-primary">{allUsers.length}</span></div>
	</div>
	<section class="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
		{#each allUsers as user}
			<Card class="cardNormalize bg-secondary/30 w-full! sm:w-xs">
				<CardHeader>
					<CardTitle
						class="text-xl font-bold bg-gradient-to-r from-chart-1 to-chart-3 bg-clip-text text-transparent"
						>{user.name}
					</CardTitle>
					<CardDescription>{user.email} <br /> {user.id}</CardDescription>
				</CardHeader>
				<CardContent>
					<Separator class="mb-4" />
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
				<CardFooter class="flex justify-between">
					<p>{dateTimmeUTCformatter(user.createdAt)}</p>
					<div>
						{#if (user.role as Role) !== 'ADMIN'}
							<DeleteBtn id={user.id} actionRoute={'?/deleteUser'} />
						{/if}
					</div>
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
