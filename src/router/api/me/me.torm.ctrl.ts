import { User } from '@src/entity/User';
import { Context } from 'koa';
import { getRepository } from 'typeorm';

export const getMe = async (ctx: Context) => {
  const user = ctx.user;
  // TODO: refactoring below code -> middleware already exists?
  if (!user) {
    ctx.status = 500;
    ctx.body = {
      name: 'InvalidAccessToken',
      payload: 'User in Cookie Token is invalid',
    };
    return;
  }
  try {
    const userData = await getRepository(User).findOne({
      id: user.id,
    });

    if (!userData) {
      ctx.status = 404;
      ctx.body = {
        name: 'UserNotFound',
        payload: 'User is not found',
      };
      return;
    }

    ctx.body = userData;
  } catch (e) {
    ctx.throw(500, e);
  }
};
