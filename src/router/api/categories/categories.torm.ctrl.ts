import { Category } from '@src/entity/Category';
import { Context } from 'koa';
import { getRepository } from 'typeorm';

export const getCategories = async (ctx: Context) => {
  try {
    const categires = await getRepository(Category).find();

    ctx.body = categires;
  } catch (e: any) {
    ctx.throw(500, e);
  }
};

// TODO: posts paging
export const getCategory = async (ctx: Context) => {
  try {
    const params = ctx.params;
    const { slug } = params;
    // const { cursor, take_latest } = params;

    // const category = await getRepository(Category).findOne({
    //   where: { url_slug: slug },
    //   relations: ['posts'],
    // });

    const category = await getRepository(Category)
      .createQueryBuilder('category')
      .innerJoinAndSelect('category.posts', 'post')
      .where('category.url_slug = :slug', { slug })
      .orderBy('post.id', 'DESC')
      .getOne();

    ctx.body = category;
  } catch (e: any) {
    ctx.throw(500, e);
  }
};
