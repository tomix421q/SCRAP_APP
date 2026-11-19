import type { Role } from './types';

/** Roles with access to every `/admin/*` route. */
export const ADMIN_PANEL_ROLES = ['ADMIN', 'MODERATOR'] as const satisfies readonly Role[];

/** Roles allowed to manage operators on `/admin/operatorregister`. */
export const OPERATOR_MANAGE_ROLES = [
	'ADMIN',
	'MODERATOR',
	'ENGINEER'
] as const satisfies readonly Role[];

const OPERATOR_REGISTER_PATH = '/admin/operatorregister';

const trimTrailingSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path);

/**
 * Where a signed-in user with `role` must be redirected when opening `pathname` under `/admin`.
 * Returns `null` when access is allowed.
 */
export function resolveAdminRedirect(role: string | null, pathname: string): string | null {
	if ((ADMIN_PANEL_ROLES as readonly (string | null)[]).includes(role)) return null;

	if (role === ('ENGINEER' satisfies Role)) {
		const path = trimTrailingSlash(pathname);
		if (path === OPERATOR_REGISTER_PATH || path.startsWith(`${OPERATOR_REGISTER_PATH}/`)) {
			return null;
		}
		return path === '/admin' ? OPERATOR_REGISTER_PATH : '/';
	}

	return '/';
}

/**
 * Entry link to the admin area for a user with `role`, or `null` when the role has no access.
 * Derived from `resolveAdminRedirect`, so the menu link and the layout guard never disagree.
 */
export function adminPanelHref(role: string | null): string | null {
	const target = resolveAdminRedirect(role, '/admin');
	if (target === null) return '/admin';
	return target.startsWith('/admin') ? target : null;
}
