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
