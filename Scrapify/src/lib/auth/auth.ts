import prismaClient from './../server/prisma';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

export const auth = betterAuth({
	database: prismaAdapter(prismaClient, {
		provider: 'postgresql'
	}),
	emailAndPassword: {
		autoSignIn: true,
		enabled: true,
		requireEmailVerification: false //for now

		// sendResetPassword: async ({ user, url, token }, request) => {
		// 	await sendResetPasswordEmail(url, user);
		// }
	},

	// emailVerification: {
	// 	autoSignInAfterVerification: true,
	// 	sendOnSignUp: true,
	// 	sendVerificationEmail: async (options) => {
	// 		const { user, url } = options;
	// 		// console.log('Verification url:', url)
	// 		await sendVerificationEmail(url, user);
	// 	}
	// },
	// socialProviders: {
	// 	google: {
	// 		clientId: GOOGLE_CLIENT_ID as string,
	// 		clientSecret: GOOGLE_CLIENT_SECRET as string
	// 	}
	// },
	trustedOrigins: [
		process.env.PUBLIC_APP_BASE_URL || 'http://localhost:3000',
		'http://localhost:3000',
		'http://127.0.0.1:3000'
	]
	// accountLinking: {
	// 	enabled: true,
	// 	trustedProviders: ['google', 'email-password'],
	// 	allowDifferentEmails: false
	// }
});
