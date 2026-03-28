import { defineConfig } from 'astro/config';
import remarkChirpyAttrs from './src/plugins/remark-chirpy-attrs.mjs';

export default defineConfig({
  site: 'https://dennisresearchnote.github.io/',
  markdown: {
    remarkPlugins: [remarkChirpyAttrs],
  },
});