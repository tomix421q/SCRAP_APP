import { describe, expect, it } from 'vitest';
import { adminPanelHref, resolveAdminRedirect } from '../src/lib/utils/adminAccess';

describe('resolveAdminRedirect', () => {
	it.each(['ADMIN', 'MODERATOR'])('%s may open every admin route', (role) => {
		expect(resolveAdminRedirect(role, '/admin')).toBeNull();
		expect(resolveAdminRedirect(role, '/admin/partgroups')).toBeNull();
		expect(resolveAdminRedirect(role, '/admin/operatorregister')).toBeNull();
	});

	it('ENGINEER may open operatorregister', () => {
		expect(resolveAdminRedirect('ENGINEER', '/admin/operatorregister')).toBeNull();
		expect(resolveAdminRedirect('ENGINEER', '/admin/operatorregister/')).toBeNull();
	});

	it('ENGINEER on the admin index goes to operatorregister', () => {
		expect(resolveAdminRedirect('ENGINEER', '/admin')).toBe('/admin/operatorregister');
		expect(resolveAdminRedirect('ENGINEER', '/admin/')).toBe('/admin/operatorregister');
	});

	it('ENGINEER on any other admin route goes home', () => {
		expect(resolveAdminRedirect('ENGINEER', '/admin/partgroups')).toBe('/');
		expect(resolveAdminRedirect('ENGINEER', '/admin/operatorregister-old')).toBe('/');
	});

	it.each(['USER', 'UNKNOWN', null])('%s goes home', (role) => {
		expect(resolveAdminRedirect(role, '/admin')).toBe('/');
		expect(resolveAdminRedirect(role, '/admin/operatorregister')).toBe('/');
	});
});

describe('adminPanelHref', () => {
	it.each(['ADMIN', 'MODERATOR'])('%s gets the admin panel', (role) => {
		expect(adminPanelHref(role)).toBe('/admin');
	});

	it('ENGINEER gets the operator register', () => {
		expect(adminPanelHref('ENGINEER')).toBe('/admin/operatorregister');
	});

	it.each(['USER', null])('%s gets no link', (role) => {
		expect(adminPanelHref(role)).toBeNull();
	});
});
