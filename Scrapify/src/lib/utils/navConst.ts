import { ClipboardList, House, ScanBarcode } from '@lucide/svelte';

export const navUrls = [
	{
		icon: House,
		title: 'Home',
		shortname: 'H',
		url: '/'
	},
	{
		icon: ScanBarcode,
		title: 'Assembly scan',
		shortname: 'Sc-Sc',
		url: '/scandmclabel'
	},
	{
		icon: ClipboardList,
		title: 'Scrap records',
		shortname: 'Records',
		url: '/scrapRecords'
	}
	// {
	// 	icon: NewspaperIcon,
	// 	title: 'Record scrap',
	// 	shortname: 'Cr-Sc',
	// 	url: '/createScrap'
	// }
];
