<script lang="ts">
	import './../styles/shadCn.css';
	import './../styles/app.css';
	import favicon from '$lib/assets/ico.png';
	import { navUrls } from '@/utils/navConst';
	import Button from '@/components/ui/button/button.svelte';
	import { page } from '$app/state';
	import User from '@/components/organism/User.svelte';
	import bgDesktop from '@/../lib/assets/background.svg';
	import type { LayoutData } from './$types';
	import { Bug, Github, Menu } from '@lucide/svelte';
	import Separator from '@/components/ui/separator/separator.svelte';
	import { getUserIdCardFromLc } from '@/index';
	import { afterNavigate, goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import MobileMenu from '@/components/molecules/MobileMenu.svelte';

	// let navigatee = $derived(navigating.complete);
	let { children, data }: { children: any; data: LayoutData } = $props();
	let currentPath = $state('');
	let userIdCardFromLc = $state<string | null>(null);
	const { user } = $derived(data);
	let getActuallTime = $state<Date>(new Date());

	onMount(() => {
		if (user?.cardId) {
			localStorage.setItem('operatorId', user.cardId.toString());
		}
		userIdCardFromLc = getUserIdCardFromLc();

		const intervalId = setInterval(() => {
			getActuallTime = new Date();
		}, 60000);
		return () => clearInterval(intervalId);
	});

	afterNavigate(() => {
		// currentPath = window.location.pathname;
		currentPath = page.url.pathname;
	});

	$effect(() => {
		if (getActuallTime.getHours() === 14 && getActuallTime.getMinutes() === 0) {
			localStorage.removeItem('operatorId');
		}
		if (getActuallTime.getHours() === 22 && getActuallTime.getMinutes() === 0) {
			localStorage.removeItem('operatorId');
		}
		if (getActuallTime.getHours() === 6 && getActuallTime.getMinutes() === 0) {
			localStorage.removeItem('operatorId');
		}
	});

	// $inspect(actPage);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Scrapify</title>
</svelte:head>

<section>
	<div class="fixed inset-0 bg-black/80 -z-40"></div>
	<img
		src={bgDesktop}
		alt="Pozadie prihlasovacej stránky"
		class="fixed inset-0 h-full w-full object-cover -z-50 max-lg:hidden animate-move"
	/>

	<!--  -->
	<!-- NAV -->
	<nav class="p-2 mb-6 flex items-center justify-between">
		<!-- Logo -->
		<section>
			<a href="/" class="flex items-center group">
				<img src={favicon} alt="Scrapify icon" class="size-10" />
				<span class="text-sm uppercase font-bold"
					>Scrap<br class="group-hover:hidden transition-all duration-300 ease-in" />ify</span
				>
				<div class="flex flex-col gap-0.5">
					<span class="mb-auto leading-3 mx-2 text-muted-foreground text-xs">Version 2.0</span>
					<span class="mb-auto leading-3 mx-2 text-xs text-chart-1">{user?.role}</span>
					<span class="mb-auto leading-3 mx-2 text-xs text-chart-1">{userIdCardFromLc}</span>
				</div>
			</a>
		</section>
		<!-- Menu -->
		<div class="flex gap-2">
			<!-- Menu desktop -->
			<section class="hidden lg:flex gap-6 items-center">
				{#each navUrls as url}
					{@const isActive = page.url.pathname === url.url}

					<Button
						href={url.url}
						size="sm"
						variant="link"
						class="flex font-normal tracking-wide text-white {isActive ? ' bg-primary' : ''}"
					>
						<!-- <url.icon class="size-6" /> -->
						<p class="lg:text-lg">{url.title}</p>
					</Button>
				{/each}
			</section>
			<User user={data} />
			<!-- Menu mobile -->
			<section class="flex lg:hidden items-center">
				<MobileMenu />
			</section>
		</div>
	</nav>

	<!-- ALL CONTENT RENDER -->
	<main class="max-w-[1650px] mx-auto px-2 md:px-3 lg:px-4 min-h-screen">
		{@render children?.()}
	</main>

	<!-- FOOTER -->
	{#if currentPath !== '/login' && currentPath !== '/register'}
		<footer class="min-h-[150px] p-4 mt-64">
			<Separator class="bg-primary/30" />
			<div class="flex flex-col justify-center items-center max-w-[1200px] mx-auto">
				<Button
					variant="link"
					href="https://github.com/tomix421q/SCRAP_APP/tree/main/Scrapify"
					target="_blank"><Github />Project Github</Button
				>
				<Button variant="link"
					><a href="mailto:tomas.zilka@yanfeng.com" class="flex items-center gap-x-2"
						><Bug />Send bug</a
					></Button
				>

				<div class="mt-4">
					{#each navUrls as url}
						<Button variant="link" href={url.url}>{url.title}</Button>
					{/each}
				</div>
			</div>
		</footer>
	{/if}
</section>
