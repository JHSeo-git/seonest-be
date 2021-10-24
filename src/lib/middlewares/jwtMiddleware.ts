import { AuthToken } from '@src/entity/AuthToken';
import { User } from '@src/entity/User';
import { Context, Middleware } from 'koa';
import { getRepository } from 'typeorm';
import { decodeToken, setTokenCookie } from '../token/jwt';

const refresh = async (ctx: Context, refreshToken: string) => {
  try {
    const decoded = await decodeToken<RefreshTokenDecoded>(refreshToken);
    const user = await getRepository(User).findOne(decoded.userId);
    if (!user) {
      throw new Error('InvalidRefreshToken');
    }
    const tokens = await user.refreshUserToken(
      decoded.tokenId,
      decoded.exp,
      refreshToken
    );
    setTokenCookie(ctx, tokens);
    return {
      id: decoded.userId,
      exp: decoded.exp,
    };
  } catch (e) {
    throw e;
  }
};

const jwtMiddleware: Middleware = async (ctx, next) => {
  let accessToken = ctx.cookies.get('access_token');
  const refreshToken = ctx.cookies.get('refresh_token');

  try {
    if (!accessToken) {
      throw new Error('NoAccessToken');
    }
    const accessTokenData = await decodeToken<AccessTokenDecoded>(accessToken);

    const diff = accessTokenData.exp * 1000 - new Date().getTime();
    // half of 1h
    if (diff < 1000 * 60 * 30 && refreshToken) {
      ctx.user = await refresh(ctx, refreshToken);
    } else {
      ctx.user = {
        id: accessTokenData.userId,
        exp: accessTokenData.exp,
      };
    }
  } catch (e) {
    if (!refreshToken) {
      ctx.user = null;
      return next();
    }
    try {
      const refreshData = await refresh(ctx, refreshToken);
      ctx.user = {
        id: refreshData.id,
        exp: refreshData.exp,
      };
    } catch (e) {}
  }

  return next();
};

export default jwtMiddleware;

type AccessTokenDecoded = {
  subject: string;
  userId: number;
  iat: number;
  exp: number;
};

type RefreshTokenDecoded = {
  tokenId: string;
} & AccessTokenDecoded;

declare module 'koa' {
  interface BaseContext {
    user: null | { id: number; exp: number };
  }
}
