import z from 'zod';

export const loginSchema = z.object({
	email: z.email().nonempty('Email is required'),
	password: z
		.string()
		.min(8, { message: 'Password must be at least 10 characters long' })
		.max(100, { message: 'Password must not exceed 100 characters' })
});

export const registerSchema = z
	.object({
		email: z.email(),
		name: z.string().min(3).max(20),
		password: z.string().min(8).max(100),
		confirmPassword: z.string().min(8).max(100)
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'password do not match',
		path: ['confirmPassword']
	});

export const requestPasswordResetSchema = z.object({
	email: z.email()
});

export const resetPasswordSchema = z
	.object({
		password: z.string().min(8).max(100),
		confirmPassword: z.string().min(8).max(100)
	})
	.refine((data) => data.password != data.confirmPassword, {
		message: 'password do not match',
		path: ['confirmPassword']
	});

export const updatePasswordSchema = z
	.object({
		currentPassword: z.string().min(8).max(100),
		newPassword: z.string().min(8).max(100),
		confirmPassword: z.string().min(8).max(100)
	})
	.refine((data) => data.newPassword != data.confirmPassword, {
		message: 'password do not match',
		path: ['confirmPassword']
	});
