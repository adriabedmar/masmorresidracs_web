import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
    const allPosts = await getCollection('content');
    
    // Sort by date (newest first)
    allPosts.sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate));
    
    return rss({
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        site: context.site,
        items: allPosts.map((post) => ({
            ...post.data,
            link: `/${post.collection}/${post.id}/`,
        })),
    });
}
