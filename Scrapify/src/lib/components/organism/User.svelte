<script lang="ts">
	import { authClient } from '$lib/auth/auth-client';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Button, { buttonVariants } from '../ui/button/button.svelte';
	import { afterNavigate, goto, invalidateAll } from '$app/navigation';
	import { User, UserCircle } from '@lucide/svelte';
	import type { LayoutData } from '../../../routes/$types';
	import Separator from '../ui/separator/separator.svelte';

	let { user }: { user: LayoutData } = $props();
	const userDb = $derived(user.user);

	const session = authClient.useSession();
	let open = $state(false);

	async function handleLogout() {
		localStorage.removeItem('operatorId');
		authClient.signOut();
		goto('/', { replaceState: true });
		await invalidateAll();
	}

	const isAdmin = (user: typeof userDb | null): boolean => {
		return user?.role === 'ADMIN' || user?.role === 'MODERATOR';
	};

	afterNavigate(() => {
		open = false;
	});

	// $inspect($session.data);
</script>

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger class={buttonVariants({ variant: 'ghost' })}>
		{#if $session.data?.user.email}
			<span class="hidden text-lg lg:block">{session.value?.data?.user.name}</span>
			<UserCircle class="size-6! text-primary" />
		{:else}
			<User class="size-6!" />
		{/if}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class=" mt-1" side="bottom" align="center">
		<DropdownMenu.Group class="flex flex-col gap-1">
			{#if $session.data?.user.email}
				<DropdownMenu.GroupHeading class="text-muted-foreground">Account</DropdownMenu.GroupHeading>
				<DropdownMenu.Separator />
				<DropdownMenu.Item><a href="/user/profile" class="w-full">Profile</a></DropdownMenu.Item>
				<!-- <DropdownMenu.Item
					><a href="/userprofile/account" class="w-full">Account</a></DropdownMenu.Item
				>
				<DropdownMenu.Item
					><a href="/userprofile/favorite" class="w-full">Favorite</a></DropdownMenu.Item
				> -->

				{#if isAdmin(userDb)}
					<DropdownMenu.Item><a href="/admin" class="w-full">Admin Panel</a></DropdownMenu.Item>
				{/if}

				<Separator />
				<DropdownMenu.Item>
					<Button variant="destructive" size="sm" onclick={handleLogout} class="w-full mt-1"
						>Logout</Button
					>
				</DropdownMenu.Item>
			{:else}
				<div class="space-y-3 p-2">
					<Button variant="default" size="sm" href="/login" class="w-full ">Login</Button>
					<Button variant="link" size="sm" href="/register" class="w-full">Register</Button>
				</div>
			{/if}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
