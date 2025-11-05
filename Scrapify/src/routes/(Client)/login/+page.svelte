<script lang="ts">
	import { authClient } from '$lib/auth/auth-client.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { loginSchema } from '$lib/utils/zod/auth';
	import { Eye, EyeOff } from '@lucide/svelte';
	import { slide } from 'svelte/transition';

	let email = $state('');
	let password = $state('');
	let errorMsg = $state<string[]>([]);
	let loading = $state(false);
	let openResendEmail = $state(false);
	let emailToVerify = $state('');
	let showPassword = $state(false);

	async function handleSubmit(event: { preventDefault: () => void }) {
		event.preventDefault();
		showPassword = false;
		loading = true;

		const validationResult = loginSchema.safeParse({ email, password });
		if (!validationResult.success) {
			errorMsg = validationResult.error.issues.map((issue) => issue.message);
			loading = false;
			return;
		}

		const { data, error } = await authClient.signIn.email(
			{
				email,
				password
			},
			{
				onSuccess: (ctx: any) => {
					// goto('/', { invalidateAll: true });
					window.location.href = '/';
				},
				onError: (ctx: any) => {
					if (ctx.error.status === 403) {
						errorMsg = ['Please verify your email'];
					}
					console.log(ctx.error);
					errorMsg = [ctx.error.message];
				}
			}
		);

		loading = false;
	}
	async function socialLogin(event: { preventDefault: () => void }) {
		event.preventDefault();
		await authClient.signIn.social({
			provider: 'google'
		});
	}
	async function sendVerificationEmail(event: { preventDefault: () => void }) {
		event.preventDefault();
		await authClient.sendVerificationEmail(
			{
				email: emailToVerify,
				callbackURL: '/login'
			},
			{
				onSuccess: (ctx: any) => {
					openResendEmail = false;
					emailToVerify = '';
					errorMsg = ['Verification email sent check email'];
				},
				onError: (ctx: any) => {
					errorMsg = [ctx.error.message];
				}
			}
		);
	}
</script>

<main
	class="absolute top-0 left-0 flex h-[106vh] w-full flex-col items-center justify-center bg-[url('/image2.jpg')] bg-cover bg-fixed bg-center bg-no-repeat"
>
	<section class="bg-secondary/50 backdrop-blur-2xl p-4 rounded-xl shadow-2xl">
		<h2 class="m-1 text-2xl font-semibold text-center">Login</h2>
		<!-- Login form -->
		<form
			onsubmit={handleSubmit}
			class="flex min-w-[320px] flex-col rounded-xl p-3 duration-2 ease-in space-y-4"
		>
			<div>
				<Input
					autocomplete="email"
					type="email"
					id="email"
					bind:value={email}
					disabled={loading}
					class="inputNormalize autofill:bg-white/30"
					placeholder="Your Email"
				/>
			</div>
			<div class="relative">
				<Input
					autocomplete="current-password"
					type={showPassword ? 'text' : 'password'}
					id="password"
					bind:value={password}
					disabled={loading}
					class="inputNormalize"
					placeholder="Your Password"
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

			{#if errorMsg.length > 0}
				<div transition:slide class="mt-1 max-w-[280px]">
					{#each errorMsg as error}
						<div class="text-xs font-bold text-red-500">
							{error}
						</div>
					{/each}
				</div>
			{/if}

			<Button type="submit" disabled={loading} class="mt-6">
				{#if loading}
					Submitting...
				{:else}
					Login
				{/if}
			</Button>

			<div class="mx-auto mt-6 flex max-w-[280px] flex-wrap justify-center gap-x-4 text-sm">
				<a href="/register" class="mt-1 text-center text-clip underline">Register </a>
				<a href="/" class="mt-1 text-center underline">Home</a>

				<!-- <button
				type="button"
				onclick={() => (openResendEmail = !openResendEmail)}
				class="mt-1 text-center text-xs underline">Resend verification email</button
			>
			<a href="/forget-password" class="mt-1 text-center text-xs underline">
				Forgot your password?
			</a> -->
			</div>
		</form>

		<!-- Resend mail form -->
		<!-- {#if openResendEmail}
		<div transition:slide class=" mt-4 min-w-[320px] rounded-xl bg-white/50 p-4 backdrop-blur-xs">
			<form onsubmit={sendVerificationEmail} class="flex flex-col gap-y-2">
				<Label for="emailToVerify">Email</Label>
				<Input
					type="email"
					id="emailToVerify"
					bind:value={emailToVerify}
					disabled={loading}
					required
					class="focus-visible:ring-my-indigo focus-visible:ring-2 "
					placeholder="Your Email"
				/>
				<Button type="submit" class="w-full">Send Verification Emails</Button>
			</form>
		</div>
	{/if}
	<Button onclick={socialLogin} variant="outline" class="mt-4"
		><ExternalLinkIcon /> Log-in with google</Button
	> -->
	</section>
</main>
