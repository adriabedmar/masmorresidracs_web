import { defineCollection, z } from 'astro:content';
import { number } from 'astro:schema';
import { glob } from 'astro/loaders';
import { parseDate } from './utils/dates';

const content = defineCollection({
	// Load Markdown and MDX files from all subdirectories in `src/content/`
	loader: glob({ base: './src/content', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string().optional(),
			short_description: z.string().optional(),
			long_description: z.string().optional(),
			category: z.enum(['aventures', 'contingut_extra']).optional(),
			number_of_players: number().int().min(-1).optional(),
			adventure_level: number().int().min(-1).optional(),
			tags: z.array(z.string()).optional(),
			// Transform string to Date object (supports 'DD MM YYYY' format)
			pubDate: z.string().transform(parseDate),
			updatedDate: z.string().transform(parseDate).optional(),
			heroImage: image().optional(),
			pdf_path: z.string().optional(),
		}),
});

export const collections = { content };
