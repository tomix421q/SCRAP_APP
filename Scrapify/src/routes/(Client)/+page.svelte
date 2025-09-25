<script lang="ts">
	import OperatorLogin from '@/components/molecules/OperatorLogin.svelte';
	import svgMain from './../../lib/assets/mainPage.svg';

	// $inspect(data);
</script>

<div class={`min-h-screen flex flex-col relative lg:mt-16 `}>
	<div class="lg:-mb-30 max-sm:mb-12 mb-6 z-40"><OperatorLogin /></div>

	<img src={svgMain} alt="landing" class="object-cover z-10 animate-wiggle" />

	<h1
		class="text-xl lg:text-4xl font-extrabold bg-gradient-to-r from-primary via-chart-1 to-chart-2 font-mono text-transparent bg-clip-text tracking-wider text-center lg:-mt-62"
	>
		Your central point for waste reduction.
	</h1>
</div>
