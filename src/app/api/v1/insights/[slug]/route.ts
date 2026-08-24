import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJsonCached } from '@/lib/api/respond';
import { notFound } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

/** GET /api/v1/insights/:slug — one published article, including body. */
export const GET = handleApi(
  async (request: Request, { params }: { params: { slug: string } }) => {
    const slug = decodeURIComponent(params.slug ?? '').slice(0, 191);
    const p = await prisma.blogPost.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null, publishedAt: { lte: new Date() } },
      include: { category: true },
    });
    if (!p) throw notFound('Article not found.');

    return apiJsonCached(
      request,
      {
        slug: p.slug,
        locale: p.locale,
        title: p.title,
        excerpt: p.excerpt,
        body: p.body,
        coverImage: p.coverImage,
        readingMinutes: p.readingMinutes,
        authorName: p.authorName,
        category: p.category ? { slug: p.category.slug, name: p.category.name } : null,
        tags: p.tags ? p.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        publishedAt: p.publishedAt?.toISOString() ?? null,
      },
      { maxAge: 120 },
    );
  },
);

export const OPTIONS = handleOptions;
