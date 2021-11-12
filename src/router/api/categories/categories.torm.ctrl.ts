import { Category } from '@src/entity/Category';
import { PostRead } from '@src/entity/PostRead';
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
      .innerJoinAndSelect('post.user', 'user')
      .where('category.url_slug = :slug', { slug })
      .andWhere(cursor ? 'post.id < :cursor' : '1=1', { cursor })
      .orderBy('post.id', 'DESC')
      .limit(takeLatest ?? 10)
      .getRawMany<RawCategory>();

    const categoryWithPostsAndCount = await Promise.all(
      categoryWithPosts.map(async (post) => {
        const postCountArr = await getRepository(PostRead)
          .createQueryBuilder('post_reads')
          .select('post_reads.ip_hash')
          .where(`post_reads.post.id = ${post.post_id}`)
          .groupBy('post_reads.ip_hash')
          .getRawMany();
        return {
          ...post,
          post_read_count: postCountArr.length,
        };
      })
    );

    ctx.body = categoryWithPostsAndCount;
  } catch (e: any) {
    ctx.throw(500, e);
  }
};

type RawCategory = {
  category_id: number;
  category_name: string;
  category_url_slug: string;
  category_created_at: string;
  category_updated_at: string;
  category_user_id: number;
  post_id: number;
  post_title: string;
  post_body: string;
  post_short_description: string | null;
  post_thumbnail: string | null;
  post_url_slug: string;
  post_is_temp: boolean;
  post_read_time: number;
  post_created_at: string;
  post_updated_at: string;
  post_user_id: number;
  post_read_count?: number;
  user_id: number;
  user_email: string;
  user_display_name: string;
  user_photo_url: string | null;
  user_is_admin: boolean;
  user_created_at: string;
  user_updated_at: string;
};
