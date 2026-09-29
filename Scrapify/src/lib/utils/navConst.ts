import { House, NewspaperIcon, Scan, ScanBarcode, Search, User } from '@lucide/svelte';

export const navUrls = [
	{
		icon: House,
		title: 'Home',
		shortname: 'H',
		url: '/'
	},
	{
		icon: ScanBarcode,
		title: 'Scan scrap',
		shortname: 'Sc-Sc',
		url: '/scandmclabel'
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
	}

	// {
	// 	icon: Flag,
	// 	title: 'Report',
	// 	shortname: 'RPRT',
	// 	url: '/report'
	// }
];
