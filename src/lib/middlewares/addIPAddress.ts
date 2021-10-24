import { Middleware } from 'koa';

const addIPAddress: Middleware = (ctx, next) => {
  ctx.ipAddr = ctx.request.ips[0] ?? ctx.request.ip;
  return next();
};

export default addIPAddress;

declare module 'koa' {
  interface BaseContext {
    ipAddr: null | string;
  }
}
