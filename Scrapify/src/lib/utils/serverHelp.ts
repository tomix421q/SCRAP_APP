import { auth } from '@/auth/auth';


export async function getUserServer({ request }: { request: Request }) {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	return { user: session?.user ?? null, session: session?.session ?? null };
}
