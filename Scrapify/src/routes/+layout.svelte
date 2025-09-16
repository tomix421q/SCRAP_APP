<script lang="ts">
	import './../styles/shadCn.css';
	import './../styles/app.css';
	import favicon from '$lib/assets/ico.png';
	import { navUrls } from '@/utils/navConst';
	import Button from '@/components/ui/button/button.svelte';
	import { page } from '$app/state';
	import User from '@/components/organism/User.svelte';
	import bgDesktop from '@/../lib/assets/landingDesktop.png';
	import type { LayoutData } from './$types';
	import { Bug, Github } from '@lucide/svelte';
	import Separator from '@/components/ui/separator/separator.svelte';
	import { getUserIdCardFromLc } from '@/index';

	let { children, data }: { children: any; data: LayoutData } = $props();
	const { user } = $derived(data);

	$effect(() => {
		if (user?.cardId) {
			localStorage.setItem('operatorId', user.cardId.toString());
		}
	});

	// $inspect(data);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Scrapify</title>
</svelte:head>

<section>
	<div class="fixed inset-0 bg-black/50 -z-40"></div>
	<img
		src={bgDesktop}
		alt="Pozadie prihlasovacej stránky"
		class="fixed inset-0 h-full w-full object-fill -z-50 max-lg:hidden"
	/>
	<!-- NAV -->
	<nav class="p-2 mb-6 flex items-center justify-between border-b-1 border-secondary">
		<!-- Logo -->
		<section>
			<a href="/" class="flex items-center group">
				<img src={favicon} alt="Scrapify icon" class="size-10" />
				<span class="text-sm uppercase font-bold"
					>Scrap<br class="group-hover:hidden transition-all duration-1000 ease-in" />ify··</span
				>
				<div class="flex flex-col gap-0.5">
					<span class="mb-auto leading-3 mx-2 text-muted text-xs">Ver. 0.5 Beta</span>
					<span class="mb-auto leading-3 mx-2 text-xs text-chart-1">{user?.role}</span>
					<span class="mb-auto leading-3 mx-2 text-xs text-chart-1">{getUserIdCardFromLc()}</span>
				</div>
			</a>
		</section>
		<!-- Menu -->
		<section class="hidden lg:flex gap-4">
			{#each navUrls as url}
				{@const isActive = page.url.pathname === url.url}

				<Button
					href={url.url}
					variant="link"
					class="flex font-semibold text-white {isActive ? ' bg-primary' : ''}"
				>
					<url.icon class="size-6" />
					<p class="lg:text-lg">{url.title}</p>
				</Button>
			{/each}
			<User user={data} />
		</section>
	</nav>

	<!-- ALL CONTENT RENDER -->
	<main class="max-w-[1600px] mx-auto px-2 min-h-screen">
		{@render children?.()}
	</main>

	<!-- FOOTER -->
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
</section>
