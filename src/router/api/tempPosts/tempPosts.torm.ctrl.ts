import { Post } from '@src/entity/Post';
import { TempPost } from '@src/entity/TempPost';
import { User } from '@src/entity/User';
import {
  getReadTime,
  generateUrlSlug,
  validateBodySchema,
} from '@src/lib/common';
import Joi from 'joi';
import { Context } from 'koa';
import { getManager, getRepository, LessThan } from 'typeorm';

export const getTempPosts = async (ctx: Context) => {
  try {
    const params = ctx.query;
    const { user_id, cursor } = params;

    const posts = await getRepository(Post).find({
      where: {
        ...(user_id ? { user: { id: user_id } } : {}),
        ...(cursor ? { id: LessThan(cursor) } : {}),
        is_temp: true,
      },
      relations: ['user'],
      take: 10,
      order: {
        id: 'DESC',
      },
    });

    ctx.body = posts;
  } catch (e) {
    ctx.throw(500, e);
  }
};

type saveTempPostSchema = {
  title: string;
  body: string;
  shortDescription?: string;
  thumbnail?: string;
};

export const saveTempPost = async (ctx: Context) => {
  const bodySchema = Joi.object<saveTempPostSchema>().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    shortDescription: Joi.string().allow(''),
    thumbnail: Joi.string().allow(''),
  });

  if (!(await validateBodySchema(ctx, bodySchema))) {
    return;
  }

  const {
    title,
    body,
    shortDescription,
    thumbnail,
  }: saveTempPostSchema = ctx.request.body;
  try {
    const currentUser = await getRepository(User).findOne({
      id: ctx.user?.id,
    });

    if (!currentUser) {
      ctx.status = 404;
      ctx.body = {
        name: 'UserNotFound',
        payload: 'Current User is not found',
      };
      return;
    }

    const params = ctx.params;
    const { slug } = params;

    let urlSlug = slug ? slug : generateUrlSlug(title);
    const exist = await getRepository(Post).findOne({
      url_slug: urlSlug,
    });

    const manager = getManager();

    let targetPost: Post | null = null;

    if (exist) {
      targetPost = exist;

      if (targetPost.is_temp) {
        targetPost.title = title;
        targetPost.body = body;
        targetPost.short_description = shortDescription;
        targetPost.thumbnail = thumbnail;
        targetPost.url_slug = urlSlug;
        targetPost.user = currentUser;
        targetPost.read_time = getReadTime(body);
      }
    } else {
      targetPost = new Post();
      targetPost.title = title;
      targetPost.body = body;
      targetPost.short_description = shortDescription;
      targetPost.thumbnail = thumbnail;
      targetPost.url_slug = urlSlug;
      targetPost.user = currentUser;
      targetPost.is_temp = true;
      targetPost.read_time = getReadTime(body);
    }

    const savedPost = await manager.save(targetPost);

    const newTempPost = new TempPost();
    newTempPost.title = title;
    newTempPost.body = body;
    newTempPost.post = savedPost;

    await manager.save(newTempPost);

    ctx.body = savedPost;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const saveNewTempPost = async (ctx: Context) => {
  const bodySchema = Joi.object<saveTempPostSchema>().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    shortDescription: Joi.string().allow(''),
    thumbnail: Joi.string().allow(''),
  });

  if (!(await validateBodySchema(ctx, bodySchema))) {
    return;
  }

  const {
    title,
    body,
    shortDescription,
    thumbnail,
  }: saveTempPostSchema = ctx.request.body;
  try {
    const currentUser = await getRepository(User).findOne({
      id: ctx.user?.id,
    });

    if (!currentUser) {
      ctx.status = 404;
      ctx.body = {
        name: 'UserNotFound',
        payload: 'Current User is not found',
      };
      return;
    }

    let urlSlug = generateUrlSlug(title);
    const exists = await getRepository(Post).findOne({
      url_slug: urlSlug,
    });

    if (exists) {
      urlSlug = generateUrlSlug(`${title} ${Date.now()}`);
    }

    const manager = getManager();

    let targetPost = new Post();
    targetPost.title = title;
    targetPost.body = body;
    targetPost.short_description = shortDescription;
    targetPost.thumbnail = thumbnail;
    targetPost.url_slug = urlSlug;
    targetPost.user = currentUser;
    targetPost.is_temp = true;
    targetPost.read_time = getReadTime(body);

    const savedPost = await manager.save(targetPost);

    const newTempPost = new TempPost();
    newTempPost.title = title;
    newTempPost.body = body;
    newTempPost.post = savedPost;

    await manager.save(newTempPost);

    ctx.body = savedPost;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getLastTempPost = async (ctx: Context) => {
  try {
    const params = ctx.params;
    const { slug } = params;

    if (!slug) {
      ctx.status = 404;
      ctx.body = {
        name: 'NotFoundSlug',
        payload: 'It not Found url slug in request',
      };
      return;
    }

    const post = await getRepository(Post).findOne({
      url_slug: slug,
    });

    if (!post) {
      ctx.status = 404;
      ctx.body = {
        name: 'NotFoundPost',
        payload: 'It not Found Post by slug',
      };
      return;
    }

    const lastTempPost = await getRepository(TempPost).findOne({
      where: {
        post,
      },
      relations: ['post'],
      order: { id: 'DESC' },
    });

    const serialized = lastTempPost
      ? {
          id: lastTempPost.id,
          title: lastTempPost.title,
          body: lastTempPost.body,
          created_at: lastTempPost.created_at,
          updated_at: lastTempPost.updated_at,
          short_description: lastTempPost.post.short_description,
          thumbnail: lastTempPost.post.thumbnail,
          url_slug: lastTempPost.post.url_slug,
        }
      : lastTempPost;

    ctx.body = serialized;
  } catch (e) {
    ctx.throw(500, e);
  }
};
