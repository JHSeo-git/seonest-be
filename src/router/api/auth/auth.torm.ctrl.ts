import { SocialAccount } from '@src/entity/SocialAccount';
import { User } from '@src/entity/User';
import { validateBodySchema } from '@src/lib/common';
import getGoogleProfile from '@src/lib/google/getGoogleProfile';
import { resetTokenCookie, setTokenCookie } from '@src/lib/token/jwt';
import Joi from 'joi';
import { Context } from 'koa';
import { getManager, getRepository } from 'typeorm';

type LoginWithGoogleBodySchema = {
  access_token: string;
  admin_mode: boolean;
};

export const loginWithGoogle = async (ctx: Context) => {
  const bodySchema = Joi.object<LoginWithGoogleBodySchema>().keys({
    access_token: Joi.string().required(),
    admin_mode: Joi.boolean().required(),
  });

  if (!(await validateBodySchema(ctx, bodySchema))) {
    return;
  }

  const {
    access_token: accessToken,
    admin_mode: adminMode,
  }: LoginWithGoogleBodySchema = ctx.request.body;
  try {
    const profile = await getGoogleProfile(accessToken);

    // 1. find social account if exists
    const socialAccount = await getRepository(SocialAccount).findOne({
      where: {
        provider: 'google',
        social_id: profile.socialId,
      },
      relations: ['user'],
    });

    // 2-1. not exists -> create user, socialAccount -> login
    // 2-2. exists -> login
    if (!socialAccount) {
      if (adminMode) {
        ctx.status = 401;
        ctx.body = {
          name: 'NotAuthorized',
          payload: 'This User is not Admin User',
        };
        return;
      }

      const user = new User();
      user.email = profile.email;
      user.display_name = profile.displayName;
      user.photo_url = profile.photo ?? undefined;

      const newSocialAccount = new SocialAccount();
      newSocialAccount.provider = 'google';
      newSocialAccount.social_id = profile.socialId;
      newSocialAccount.user = user;

      const manager = getManager();
      await manager.save([user, newSocialAccount]);

      const tokens = await user.generateUserToken();
      setTokenCookie(ctx, tokens);

      ctx.body = {
        user,
        tokens: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        },
      };
    } else {
      const user = await getRepository(User).findOne({
        id: socialAccount.user.id,
        ...(adminMode ? { is_admin: true } : {}),
      });

      if (!user) {
        ctx.status = 404;
        ctx.body = {
          name: 'UserNotFound',
          payload: 'User is not found Error',
        };
        return;
      }

      const tokens = await user.generateUserToken();
      setTokenCookie(ctx, tokens);

      ctx.body = {
        user,
        tokens: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        },
      };
    }
  } catch (e: any) {
    ctx.throw(500, e);
  }
};

export const logout = async (ctx: Context) => {
  resetTokenCookie(ctx);
  ctx.status = 204;
};
