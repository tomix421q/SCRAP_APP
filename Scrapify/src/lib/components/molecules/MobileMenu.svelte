<script lang="ts">
	import { Menu, X } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';
	import { navUrls } from '@/utils/navConst';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

	let isOpen = $state(false);

	afterNavigate(() => {
		// currentPath = window.location.pathname;
		isOpen = false;
	});

	// $inspect(isOpen);
</script>

<Button variant="outline" size="icon" onclick={() => (isOpen = !isOpen)} class="z-50">
	{#if !isOpen}
		<Menu class="size-9" />
	{:else}
		<X class="size-9 fixed bg-destructive" />
	{/if}
</Button>

<main
	class={isOpen
		? 'fixed bg-secondary/80 w-full h-full top-0 bottom-0 right-0 backdrop-blur-sm z-30 duration-300 p-4'
		: 'fixed -right-[1000px] top-0 bg-primary/20 w-full h-screen bottom-0 p-4'}
>
	<div class="relative text-xl font-semibold text-secondary-foreground">Menu</div>
	<nav class="z-50 min-h-screen flex flex-col items-center justify-center pb-44 gap-4 *:text-2xl">
		{#each navUrls as url}
			{@const isActive = page.url.pathname === url.url}

			<Button
				href={url.url}
				size="lg"
				variant="link"
				class="flex font-normal tracking-wide text-white {isActive ? ' bg-primary' : ''}"
			>
				<!-- <url.icon class="size-6" /> -->
				<p class="lg:text-lg">{url.title}</p>
			</Button>
		{/each}
	</nav>
</main>
