<script lang="ts">
	import OperatorLogin from '@/components/molecules/OperatorLogin.svelte';
	import svgMain from './../../lib/assets/mainPage.svg';
	import type { LayoutData } from '../$types';
	import LandingStatistic from '@/components/molecules/LandingStatistic.svelte';

	let { data }: { data: LayoutData } = $props();
	// $inspect(data);
</script>

<div class={`min-h-screen flex flex-col relative lg:mt-8 gap-6`}>
	<div
		class="text-xl lg:text-4xl font-extrabold bg-gradient-to-r from-primary via-chart-1 to-chart-2 font-mono text-transparent bg-clip-text tracking-wider text-center lg:absolute bottom-28 w-full"
	>
		Your central point for waste reduction.
	</div>
	<OperatorLogin />
	<LandingStatistic stats={data.stats} />
	<!-- <div class="lg:flex items-start">
		<img src={svgMain} alt="landing" class="object-cover w-full z-10 animate-wiggle hidden md:flex" />
	</div> -->
</div>
