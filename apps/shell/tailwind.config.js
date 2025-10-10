const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: false,
	content: [
		join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
		...createGlobPatternsForDependencies(__dirname),
		// Manually include dashboard libs loaded via lazy loading
		join(__dirname, '../../libs/dashboard/**/!(*.stories|*.spec).{ts,html}'),
	],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#F1F8F3',
					100: '#DDEFE2',
					200: '#C1E0C8',
					300: '#9CCEAA',
					400: '#72B986',
					500: '#4BA666',
					600: '#3F8D55',
					700: '#2F6C41',
					800: '#235336',
					900: '#173A25',
					950: '#0F2618'
				}
			}
		},
	},
	plugins: [require('tailwindcss-primeui')],
};
