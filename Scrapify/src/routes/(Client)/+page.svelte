<script lang="ts">
	import OperatorLogin from '@/components/molecules/OperatorLogin.svelte';
	import type { PageProps } from './$types';

	// $inspect(data);
</script>

<div class={`min-h-screen flex flex-col`}>
	<section>
		<h1
			class="text-2xl lg:text-4xl italic font-extrabold bg-gradient-to-r from-secondary-foreground via-chart-1 to-secondary-foreground inline-block text-transparent bg-clip-text tracking-[15px] w-full text-center"
		>
			Your central point for waste reduction
		</h1>
	</section>
	<section class="flex items-center justify-center mt-16 lg:mt-40">
		<OperatorLogin />
	</section>
</div>
