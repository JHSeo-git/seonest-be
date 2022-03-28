import jwt, { SignOptions } from 'jsonwebtoken';
import { Context } from 'koa';

const { JWT_SECRET, NODE_ENV } = process.env;

export async function generateToken(
  payload: string | object | Buffer,
  options: SignOptions
) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET Environment Variable is not set');
  }
  const promise = new Promise<string>((resolve, reject) => {
    jwt.sign(payload, JWT_SECRET, options, (error, token) => {
      if (error) {
        reject(error);
        return;
      }
      if (!token) {
        reject(new Error('Failed to generate token'));
        return;
      }
      resolve(token);
    });
  });

  return promise;
}

export async function decodeToken<T>(token: string) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET Environment Variable is not set');
  }

  const promise = new Promise<T>((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (error, decoded) => {
      if (error) {
        reject(error);
        return;
      }
      if (!decoded) {
        reject(new Error('Token is empty'));
        return;
      }
      resolve(decoded as any);
    });
  });

  return promise;
}

export function setTokenCookie(
  ctx: Context,
  tokens: { accessToken: string; refreshToken: string }
) {
  if (NODE_ENV === 'production') {
    ctx.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
      sameSite: 'none',
      secure: true,
    });

    ctx.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
      sameSite: 'none',
      secure: true,
    });
  } else {
    // for dev
    ctx.cookies.set('access_token', tokens.accessToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    });

    ctx.cookies.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }
}

export function resetTokenCookie(ctx: Context) {
  ctx.cookies.set('access_token', '', {
    httpOnly: true,
    maxAge: 0,
  });

  ctx.cookies.set('refresh_token', '', {
    httpOnly: true,
    maxAge: 0,
  });
}
