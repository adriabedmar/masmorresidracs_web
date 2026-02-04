// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.masmorresidracs.netlify.app',
  adapter: netlify(),
  integrations: [mdx(), sitemap(), react()]
});