import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().optional(),
    draft: z.boolean().default(false),
    thumbnail: z.string().optional(),
    category: z.array(z.string()).default([]),
  }),
});

export const collections = {
  blog,
};