import { Middleware } from 'koa';

const checkAuth: Middleware = (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401;
    ctx.body = {
      name: 'NotAuthorized',
      payload: 'The request need authorized user, but unauthorized',
    };
    // ctx.status = 500;
    // ctx.body = {
    //   name: 'InvalidAccessToken',
    //   payload: 'User in Cookie Token is invalid',
    // };
    return;
  }
  return next();
};

export default checkAuth;
