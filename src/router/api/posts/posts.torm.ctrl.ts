import { Post } from '@src/entity/Post';
import { PostRead } from '@src/entity/PostRead';
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
import crypto from 'crypto';
import { Category } from '@src/entity/Category';

type SaveNewPostBodySchema = {
  title: string;
  body: string;
  shortDescription?: string;
  thumbnail?: string;
  categories?: string[];
};

export const saveNewPost = async (ctx: Context) => {
  const bodySchema = Joi.object<SaveNewPostBodySchema>().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    shortDescription: Joi.string().allow(''),
    thumbnail: Joi.string().allow(''),
    categories: Joi.array().items(Joi.string()),
  });

  if (!(await validateBodySchema(ctx, bodySchema))) {
    return;
  }

  const {
    title,
    body,
    shortDescription,
    thumbnail,
    categories,
  }: SaveNewPostBodySchema = ctx.request.body;
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

    // categories
    const categoryRepo = getRepository(Category);
    const newCategories = await Promise.all(
      (categories ?? []).map(async (category) => {
        const slug = generateUrlSlug(category);
        const exists = await categoryRepo.findOne({
          url_slug: slug,
        });

        if (!exists) {
          const newCategory = new Category();
          newCategory.name = category;
          newCategory.url_slug = slug;
          newCategory.user = currentUser;
          return await categoryRepo.save(newCategory);
        }

        return exists;
      })
    );

    const newPost = new Post();
    newPost.title = title;
    newPost.body = body;
    newPost.short_description = shortDescription;
    newPost.thumbnail = thumbnail;
    newPost.url_slug = urlSlug;
    newPost.user = currentUser;
    newPost.is_temp = false;
    newPost.read_time = getReadTime(body);
    newPost.categories = newCategories;

    const savedPost = await getRepository(Post).save(newPost);

    ctx.body = savedPost;
  } catch (e: any) {
    ctx.throw(500, e);
  }
};

export const updatePost = async (ctx: Context) => {
  const bodySchema = Joi.object<SaveNewPostBodySchema>().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    shortDescription: Joi.string().allow(''),
    thumbnail: Joi.string().allow(''),
    categories: Joi.array().items(Joi.string()),
  });

  if (!(await validateBodySchema(ctx, bodySchema))) {
    return;
  }

  const {
    title,
    body,
    shortDescription,
    thumbnail,
    categories,
  }: SaveNewPostBodySchema = ctx.request.body;
  try {
    const params = ctx.params;
    const { slug } = params;

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

    const post = await getRepository(Post).findOne({
      url_slug: slug,
    });

    if (!post) {
      ctx.status = 404;
      ctx.body = {
        name: 'PostNotFound',
        payload: 'Update Post is not found',
      };
      return;
    }

    // categories
    const categoryRepo = getRepository(Category);
    const newCategories = await Promise.all(
      (categories ?? []).map(async (category) => {
        const slug = generateUrlSlug(category);
        const exists = await categoryRepo.findOne({
          url_slug: slug,
        });

        if (!exists) {
          const newCategory = new Category();
          newCategory.name = category;
          newCategory.url_slug = slug;
          newCategory.user = currentUser;
          return await categoryRepo.save(newCategory);
        }

        return exists;
      })
    );

    post.title = title;
    post.body = body;
    post.short_description = shortDescription;
    post.thumbnail = thumbnail;
    post.is_temp = false;
    post.read_time = getReadTime(body);
    post.categories = newCategories;
    post.user = currentUser;

    const manager = getManager();
    const savedPost = await manager.save(post);

    const tempPosts = await getRepository(TempPost).find({
      post: {
        id: post.id,
      },
    });

    if (tempPosts && tempPosts.length > 0) {
      await manager.remove(tempPosts);
    }

    ctx.body = savedPost;
  } catch (e: any) {
    ctx.throw(500, e);
  }
};

export const getAllPostSlug = async (ctx: Context) => {
  try {
    const params = ctx.query;
    const { include_temp } = params;
    const posts = await getRepository(Post).find({
      where: {
        ...(include_temp !== 'true' ? { is_temp: false } : {}),
      },
    });

    ctx.body = posts.map((post) => post.url_slug);
  } catch (e: any) {
    ctx.throw(500, e);
  }
};

export const getAllPostId = async (ctx: Context) => {
  try {
    const params = ctx.query;
    const { include_temp } = params;
    const posts = await getRepository(Post).find({
      where: {
        ...(include_temp !== 'true' ? { is_temp: false } : {}),
      },
    });

    ctx.body = posts.map((post) => post.id);
  } catch (e: any) {
    ctx.throw(500, e);
  }
};

export const getPosts = async (ctx: Context) => {
  try {
    const params = ctx.query;
    const { user_id, cursor, take_latest } = params;
    const takeLatest =
      typeof take_latest === 'string' ? parseInt(take_latest) : undefined;
    const posts = await getRepository(Post).find({
      where: {
        ...(user_id ? { user: { id: user_id } } : {}),
        ...(cursor ? { id: LessThan(cursor) } : {}),
        is_temp: false,
      },
      relations: ['user', 'categories'],
      take: takeLatest ? takeLatest : 10,
      order: {
        id: 'DESC',
      },
    });

    // 다시 살림
    const postsWithCount = await Promise.all(
      posts.map(async (post) => {
        const postCountArr = await getRepository(PostRead)
          .createQueryBuilder('post_reads')
          .select('post_reads.ip_hash')
          .where(`post_reads.post.id = ${post.id}`)
          .groupBy('post_reads.ip_hash')
          .getRawMany();
        return {
          ...post,
          read_count: postCountArr.length,
        };
      })
    );

    // TODO: serialized ... omit body

    ctx.body = postsWithCount;
  } catch (e: any) {
    ctx.throw(500, e);
  }
};

type PostShortInfo = {
  id: number;
  title: string;
  url_slug: string;
};

export const getPostBySlug = async (ctx: Context) => {
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

    const postRepo = getRepository(Post);

    const post = await postRepo.findOne({
      where: { url_slug: slug },
      relations: ['user', 'categories'],
    });

    if (!post) {
      ctx.status = 404;
      ctx.body = {
        name: 'NotFoundPost',
        payload: 'It not Found Post by slug',
      };
      return;
    }

    const postReadRepo = getRepository(PostRead);

    const ipAddr = ctx.ipAddr;
    if (ipAddr) {
      const postRead = new PostRead();
      postRead.ip_hash = crypto.createHash('md5').update(ipAddr).digest('hex');
      postRead.post = post;
      await postReadRepo.save(postRead);
    }

    const postCountArr = await postReadRepo
      .createQueryBuilder('post_reads')
      .select('post_reads.ip_hash')
      .where('post_reads.post.id = :id', { id: post.id })
      .groupBy('post_reads.ip_hash')
      .getRawMany();

    const nextPostUrl = await postRepo
      .createQueryBuilder('posts')
      .select('posts.id, posts.title, posts.url_slug')
      .where('posts.id > :id', { id: post.id })
      .andWhere('posts.is_temp = :isTemp', { isTemp: false })
      .limit(1)
      .getRawOne<PostShortInfo | undefined>();

    const prevPostUrl = await postRepo
      .createQueryBuilder('posts')
      .select('posts.id, posts.title, posts.url_slug')
      .where('posts.id < :id', { id: post.id })
      .andWhere('posts.is_temp = :isTemp', { isTemp: false })
      .limit(1)
      .orderBy('posts.id', 'DESC')
      .getRawOne<PostShortInfo | undefined>();

    ctx.body = {
      ...post,
      read_count: postCountArr.length,
      next_post: nextPostUrl,
      prev_post: prevPostUrl,
    };
  } catch (e: any) {
    ctx.throw(500, e);
  }
};

export const deletePostBySlug = async (ctx: Context) => {
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

    const postRepository = getRepository(Post);
    const post = await postRepository.findOne({
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

    const removed = await postRepository.remove(post);

    if (!removed) {
      ctx.status = 500;
      ctx.body = {
        name: 'FailedDeletePost',
        payload: 'Failed delte a Post by slug',
      };
      return;
    }

    ctx.status = 204;
  } catch (e: any) {
    ctx.throw(500, e);
  }
};
