// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import ferretGrammarJson from './syntax/fer.tmLanguage.json';
import d2 from 'astro-d2';

// Cast to any to avoid type errors with the complex grammar structure
const ferretGrammar = /** @type {any} */ (ferretGrammarJson);

// https://astro.build/config
export default defineConfig({
    output: 'static',
    trailingSlash: 'ignore',
    integrations: [starlight({
        title: 'Ferret',
        description: 'A modern, type-safe programming language',
        favicon: '/favicon.png',  // Change to '/favicon.png' or '/favicon.ico' if using different format
        disable404Route: true, // Use custom 404 page instead of Starlight's
        lastUpdated: true,
        editLink: {
            baseUrl: 'https://github.com/Ferret-Language/website/edit/main/',
        },
        social: [
            { icon: 'github', label: 'GitHub', href: 'https://github.com/Ferret-Language/Ferret' }
        ],
        customCss: [
            './src/styles/custom.css',
        ],
        defaultLocale: 'root',
        locales: {
            root: {
                label: 'English',
                lang: 'en',
            },
        },
        // Use a single theme for both code snippets and playground for visual consistency.
        expressiveCode: {
            themes: ['one-dark-pro', 'one-light'], // Change this to your preferred built-in Shiki theme
            shiki: {
                langs: [ferretGrammar],
            },
        },
        components: {
            // Override the Head component to add View Transitions
            Head: './src/components/Head.astro',
            // Modern shadcn-style theme toggle
            ThemeSelect: './src/components/ThemeSelect.astro',
            // Use ferret image instead of text
            SiteTitle: './src/components/SiteTitle.astro',
            // Use custom navbar for all pages
            Header: './src/components/Header.astro',
            // Custom mobile TOC with integrated burger menu
            MobileTableOfContents: './src/components/MobileTableOfContents.astro',
        },

        sidebar: [
            {
                label: 'Getting Started',
                autogenerate: { directory: 'getting-started' },
            },
            {
                label: 'Basics',
                autogenerate: { directory: 'basics' },
            },
            {
                label: 'Control Flow',
                autogenerate: { directory: 'control-flow' },
            },
            {
                label: 'Functions',
                autogenerate: { directory: 'functions' },
            },
            {
                label: 'Type System',
                autogenerate: { directory: 'type-system' },
            },
            {
                label: 'Advanced',
                autogenerate: { directory: 'advanced' },
            },
        ],
    }), d2({
      sketch: true,
      layout: 'elk',
      // Disable generating diagrams when deploying on Vercel.
      skipGeneration: !!process.env['VERCEL'],
    })],

    vite: {
        plugins: [],
    },
});