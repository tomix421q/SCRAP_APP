<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth/auth-client.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Eye, EyeOff } from '@lucide/svelte';

	let email = $state('');
	let cardId = $state<number | undefined>();
	let name = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let errorMsg = $state('');
	let loading = $state(false);
	let showPassword = $state(false);
	// const session = authClient.useSession();

	async function handleSubmit(event: { preventDefault: () => void }) {
		event.preventDefault();
		showPassword = false;
		if (password !== confirmPassword) {
			errorMsg = 'Password dont match';
			return;
		}
		loading = true;
		let tmpCardId = cardId ? cardId : 0;

		const { data, error } = await authClient.signUp.email(
			{
				email,
				name,
				password,
				cardId: tmpCardId
			},
			{
				onSuccess: (ctx: any) => {
					goto('/login');
				},
				onError: (ctx: any) => {
					if (ctx.error.status === 403) {
						errorMsg = 'Please verify your email';
					} else if (
						ctx.error.details?.meta.target[0] === 'cardId' &&
						ctx.error.details?.code === 'P2002'
					) {
						errorMsg = 'Card ID already in use';
					} else {
						errorMsg = ctx.error.message;
					}
				}
			}
		);
		// if (error) {
		// 	if (error.message) {
		// 		errorMsg = error.message;
		// 	}
		// }
		loading = false;
	}

	async function socialLogin(event: { preventDefault: () => void }) {
		await authClient.signIn.social({
			provider: 'google'
		});
	}
</script>

<main
	class="absolute top-0 left-0 z-50 flex h-[110vh] w-full flex-col items-center justify-center bg-[url('/image1.jpg')] bg-cover bg-fixed bg-center bg-no-repeat"
>
	<section class="bg-secondary/50 backdrop-blur-2xl p-4 rounded-xl shadow-2xl">
		<h2 class="m-1 text-2xl font-semibold text-center">Register</h2>
		<form
			onsubmit={handleSubmit}
			class="flex min-w-[320px] flex-col rounded-xl p-3 space-y-4 duration-200 ease-in"
		>
			<div>
				<Input
					type="text"
					id="name"
					class="inputNormalize"
					bind:value={name}
					required
					placeholder="Full name"
					disabled={loading}
					autocomplete="off"
				/>
			</div>
			<div>
				<Input
					type="email"
					id="email"
					bind:value={email}
					required
					disabled={loading}
					autocomplete="off"
					placeholder="Your Email"
					class="inputNormalize"
				/>
			</div>
			<div>
				<Input
					type="number"
					id="cardId"
					bind:value={cardId}
					required
					disabled={loading}
					autocomplete="off"
					placeholder="Your card ID"
					class="inputNormalize"
				/>
			</div>
			<div class="relative">
				<Input
					type={showPassword ? 'text' : 'password'}
					id="password"
					bind:value={password}
					required
					disabled={loading}
					placeholder="Your Password"
					class="inputNormalize"
				/>
				<p class="absolute -top-1 right-0">
					<Button size="icon" variant="ghost" onclick={() => (showPassword = !showPassword)}>
						{#if showPassword}
							<EyeOff class="size-5 text-chart-warning" />
						{:else}
							<Eye class="size-5" />
						{/if}
					</Button>
				</p>
			</div>
			<div class="relative">
				<Input
					type={showPassword ? 'text' : 'password'}
					id="passwordConfirm"
					bind:value={confirmPassword}
					required
					disabled={loading}
					placeholder="Confirm Password"
					class="inputNormalize"
				/>
				<p class="absolute -top-1 right-0">
					<Button size="icon" variant="ghost" onclick={() => (showPassword = !showPassword)}>
						{#if showPassword}
							<EyeOff class="size-5 text-chart-warning" />
						{:else}
							<Eye class="size-5" />
						{/if}
					</Button>
				</p>
			</div>

			{#if errorMsg}
				<p class="text-destructive mt-1 bg-black px-2 text-sm">{errorMsg}</p>
			{/if}

			<Button type="submit" disabled={loading} class="mt-6">
				{#if loading}
					Submiting...
				{:else}
					Register
				{/if}
			</Button>
			<div class="mt-6 flex justify-center gap-x-2 text-sm">
				<a href="/" class="mt-1 text-center underline">Home</a>
				<a href="/login" class="mt-1 text-center underline">Login</a>
			</div>
		</form>
		<!-- <Button onclick={socialLogin} variant="outline" class="mt-4"
		><ExternalLinkIcon /> Continue with google</Button
	> -->
	</section>
</main>
