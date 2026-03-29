import { defineConfig } from 'astro/config';
import remarkChirpyAttrs from './src/plugins/remark-chirpy-attrs.mjs';
import rehypeCodeTitles from './src/plugins/rehype-code-titles.mjs';
import rehypeMermaid from './src/plugins/rehype-mermaid.mjs';

export default defineConfig({
  site: 'https://dennisresearchnote.github.io/',
  markdown: {
    remarkPlugins: [remarkChirpyAttrs],
    rehypePlugins: [rehypeCodeTitles, rehypeMermaid],
  },
});