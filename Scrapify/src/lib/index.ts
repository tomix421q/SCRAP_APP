import { browser } from '$app/environment';

export function dateTimmeUTCformatter(dateTime: Date) {
	const dateObject = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;

	if (isNaN(dateObject.getTime())) {
		return 'Invalid Date';
	}

	const result = new Intl.DateTimeFormat('sk-Sk', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
		// timeZone: 'UTC'
	}).format(dateObject);

	return result;
}

export function isWithinTimeLimit(createdAt: Date | string, limitMinutes: number): boolean {
	const createdDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
	if (isNaN(createdDate.getTime())) {
		return false;
	}
	const now = new Date();
	const diffMilliseconds = now.getTime() - createdDate.getTime();
	const diffMinutes = diffMilliseconds / (1000 * 60);

	return diffMinutes < limitMinutes;
}

export function getUserIdCardFromLc(): string | null {
	if (browser) {
		return localStorage.getItem('operatorId');
	}
	return null;
}

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

