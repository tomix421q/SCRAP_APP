<script lang="ts">
	import type { PageProps } from '../../../routes/(Admin)/admin/$types';

	let { data }: { data: any } = $props();
	let dataLog = $derived(data);

	$inspect(dataLog);
</script>

<main></main>
