import { Category } from '@src/entity/Category';
import { Context } from 'koa';
import { getRepository, LessThan } from 'typeorm';

export const getCategories = async (ctx: Context) => {
  try {
    const categires = await getRepository(Category).find();

    ctx.body = categires;
  } catch (e: any) {
    ctx.throw(500, e);
  }
};

export const getCategory = async (ctx: Context) => {
  try {
    const params = ctx.params;
    const { slug } = params;

    const category = await getRepository(Category).findOne({
      where: { url_slug: slug },
      relations: ['posts'],
    });

    ctx.body = category;
  } catch (e: any) {
    ctx.throw(500, e);
  }
};

export const getRawCategories = async (ctx: Context) => {
  try {
    const params = ctx.params;
    const queryParams = ctx.query;
    const { slug } = params;
    const { cursor, take_latest } = queryParams;
    const takeLatest =
      typeof take_latest === 'string' ? parseInt(take_latest) : undefined;

    const categoryWithPosts = await getRepository(Category)
      .createQueryBuilder('category')
      .innerJoinAndSelect('category.posts', 'post')
      .where('category.url_slug = :slug', { slug })
      .andWhere(cursor ? 'post.id < :cursor' : '1=1', { cursor })
      .orderBy('post.id', 'DESC')
      .limit(takeLatest ?? 10)
      .getRawMany<RawCategory>();

    ctx.body = categoryWithPosts;
  } catch (e: any) {
    ctx.throw(500, e);
  }
};

type RawCategory = {
  categoryId: number;
  categoryName: string;
  categoryUrlSlug: string;
  categoryCreatedAt: string;
  categoryUpdatedAt: string;
  categoryUserId: number;
  postId: number;
  postTitle: string;
  postBody: string;
  postShortDescription: null;
  postThumbnail: null;
  postUrlSlug: string;
  postIsTemp: number;
  postReadTime: number;
  postCreatedAt: string;
  postUpdatedAt: string;
  postUserId: number;
};
