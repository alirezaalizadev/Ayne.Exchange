import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJsonCached, pagination } from '@/lib/api/respond';
import { isLocale } from '@/lib/api/translations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/insights — published articles (list projection, no body).
 * Query: page, pageSize, locale, category.
 */
export const GET = handleApi(async (request: Request) => {
  const url = new URL(request.url);
  const { page, pageSize, skip, take } = pagination(url);

  const where: Prisma.BlogPostWhereInput = {
    status: 'PUBLISHED',
    deletedAt: null,
    publishedAt: { lte: new Date() },
  };
  const locale = url.searchParams.get('locale');
  if (isLocale(locale)) where.locale = locale;
  const category = url.searchParams.get('category');
  if (category) where.category = { slug: category.slice(0, 64) };

  const [total, rows] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      include: { category: true },
      skip,
      take,
    }),
  ]);

  const list = rows.map((p) => ({
    slug: p.slug,
    locale: p.locale,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    readingMinutes: p.readingMinutes,
    authorName: p.authorName,
    category: p.category ? { slug: p.category.slug, name: p.category.name } : null,
    tags: p.tags ? p.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    publishedAt: p.publishedAt?.toISOString() ?? null,
  }));

  return apiJsonCached(request, list, {
    maxAge: 120,
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
});

export const OPTIONS = handleOptions;
