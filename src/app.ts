import Koa from 'koa';
import logger from 'koa-logger';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import router from './router';
import jwtMiddleware from './lib/middlewares/jwtMiddleware';
import addIPAddress from './lib/middlewares/addIPAddress';
import healthCheck from './lib/middlewares/healthCheck';
import koaCompress from 'koa-compress';

const app = new Koa();

const validHosts = [
  'localhost:3000',
  'catch-a-nest.vercel.app',
  'seonest.net',
  'www.seonest.net',
];
const corsOptions: cors.Options = {
  // origin: '*',
  origin: (ctx) => {
    const { origin } = ctx.header;
    if (!origin) {
      return ctx.throw(`Not valid origin [${origin}]`);
    }
    const host = origin.split('://')[1];
    const vercelRegex = /jhseo-git.vercel.app/g;
    if (!validHosts.includes(host) && !vercelRegex.test(host))
      return ctx.throw(`Not valid origin [${origin}]`);

    return origin;
  },
  credentials: true,
};

app.proxy = true;
app.use(logger());
app.use(cors(corsOptions));
app.use(koaCompress());
app.use(bodyParser());
app.use(addIPAddress);
app.use(jwtMiddleware);
app.use(router.routes()).use(router.allowedMethods());
app.use(healthCheck);

export default app;
