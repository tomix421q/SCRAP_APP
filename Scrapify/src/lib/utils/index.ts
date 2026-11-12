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

const dbDateFormatter = new Intl.DateTimeFormat('sk-SK', {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	timeZone: 'UTC'
});
const dbTimeFormatter = new Intl.DateTimeFormat('sk-SK', {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	timeZone: 'UTC'
});

/**
 * Formats a DB timestamp. The DB stores local wall-clock time (GETDATE()) and Prisma
 * reads it as UTC, so formatting in UTC shows the original local time.
 */
export function dateTimeLocalTimeDb(dateTime: Date | string) {
	const { date, time } = dateTimePartsLocalTimeDb(dateTime);
	return time ? `${date} ${time}` : date;
}

/**
 * Same values as `dateTimeLocalTimeDb`, split into date and time
 * (e.g. for a two-line table cell).
 */
export function dateTimePartsLocalTimeDb(dateTime: Date | string): { date: string; time: string } {
	const dateObject = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
	if (isNaN(dateObject.getTime())) {
		return { date: 'Invalid Date', time: '' };
	}
	return { date: dbDateFormatter.format(dateObject), time: dbTimeFormatter.format(dateObject) };
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

export function getLocalDateTimeForDb(date: Date = new Date()): Date {
	const timezoneOffsetMinutes = date.getTimezoneOffset();
	const dateInMs = date.getTime();

	const adjustedDatedInMs = dateInMs - timezoneOffsetMinutes * 60 * 1000;
	return new Date(adjustedDatedInMs);
}
