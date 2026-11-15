import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

import { defineConfig } from 'vite';

// Single source of truth for the app version is package.json.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
	version: string;
};

// Mirrors the global ChangelogEntry in src/app.d.ts (vite config is outside the app's type scope).
type ChangelogEntry = { hash: string; date: string; subject: string };

const CHANGELOG_LIMIT = 40;
// Only commits touching app code count as user-visible changes (skips spec/glossary/docs commits).
const CHANGELOG_PATHS = ['src', 'prisma'];

/** Reads recent commits at build time. Returns [] when git or the .git folder is unavailable. */
function readChangelog(): ChangelogEntry[] {
	try {
		const output = execFileSync(
			'git',
			['log', `-n${CHANGELOG_LIMIT}`, '--no-merges', '--pretty=format:%h%x1f%aI%x1f%s', '--', ...CHANGELOG_PATHS],
			{ encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
		);
		return output
			.split('\n')
			.filter(Boolean)
			.map((line) => {
				const [hash, date, subject] = line.split('\x1f');
				return { hash, date, subject };
			});
	} catch {
		console.warn('[changelog] git log unavailable, building with an empty changelog');
		return [];
	}
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// Replaced at build time with the string literal, e.g. "4.3.5".
	define: {
		__APP_VERSION__: JSON.stringify(version),
		// ISO timestamp of the build, shown as "Last update" in the header.
		__APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
		// Recent commits shown in the header "Changelog" dialog.
		__APP_CHANGELOG__: JSON.stringify(readChangelog())
	}
});
