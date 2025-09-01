import { Flag, House, NewspaperIcon, Search } from '@lucide/svelte';

export const navUrls = [
	{
		icon: House,
		title: 'Home',
		shortname: 'H',
		url: '/'
	},
	{
		icon: NewspaperIcon,
		title: 'Record scrap',
		shortname: 'Cr-Sc',
		url: '/createScrap'
	},
	{
		icon: Search,
		title: 'Search',
		shortname: 'SRCH',
		url: '/search'
	},
	{
		icon: Flag,
		title: 'Report',
		shortname: 'RPRT',
		url: '/report'
	}
];
