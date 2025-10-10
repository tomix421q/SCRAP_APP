import { writeToLogger } from '@/utils/serverHelp';
import prismaClient from './../server/prisma';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createAuthMiddleware, APIError } from 'better-auth/api';

export const auth = betterAuth({
	database: prismaAdapter(prismaClient, {
		provider: 'sqlserver'
	}),
	user: {
		additionalFields: {
			cardId: {
				type: 'number',
				input: true,
				unique: true,
				required: true,
				fieldName: 'cardId'
			}
		}
	},

	emailAndPassword: {
		autoSignIn: true,
		enabled: true,
		requireEmailVerification: false //for now

		// sendResetPassword: async ({ user, url, token }, request) => {
		// 	await sendResetPasswordEmail(url, user);
		// }
	},
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			const isInDbSameCardId = await prismaClient.user.findFirst({
				where: { cardId: ctx.body?.cardId }
			});
			if (ctx.path !== '/sign-up/email') {
				return;
			}
			if (!ctx.body?.email.endsWith('@yanfeng.com')) {
				throw new APIError('BAD_REQUEST', {
					message: 'Only @yanfeng.com addresses are allowed'
				});
			}
			if (isInDbSameCardId) {
				throw new APIError('BAD_REQUEST', {
					message: 'This card ID already in use'
				});
			}
		}),
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path === '/sign-up/email') {
				const totalUsers = await prismaClient.user.count();
				if (totalUsers === 1) {
					await prismaClient.user.update({
						where: { email: ctx.body?.email },
						data: { role: 'ADMIN' }
					});
				}
				await prismaClient.activityLogs.create({
					data: {
						action: 'REGISTER',
						entityType: ctx.body?.email,
						entityId: ctx.body.id
					}
				});
			}
		})
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
		process.env.PUBLIC_PROD_URL || 'http://localhost:3000',
		'http://localhost:3000',
		'http://127.0.0.1:3000',
		'http://10.184.145.18:3001'
	]
	// accountLinking: {
	// 	enabled: true,
	// 	trustedProviders: ['google', 'email-password'],
	// 	allowDifferentEmails: false
	// }
});
