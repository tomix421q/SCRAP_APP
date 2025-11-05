<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';

	let { text = '', href = '/' } = $props();
</script>

<Button variant="link" {href} class="mb-8 capitalize align-middle text-sm lg:text-lg"
	><ArrowLeft class="size-5" />{text}
</Button>
