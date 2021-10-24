import Koa from 'koa';
import app from './app';

const PORT = parseInt(process.env.PORT ?? '5000', 10);

export default class Server {
  app: Koa<Koa.DefaultState, Koa.DefaultContext>;

  constructor() {
    this.app = new Koa();
    this.ready();
  }

  ready() {
    this.app = app;
  }

  start() {
    this.app.listen(PORT, () => {
      console.log('✅ Server is listening to port ' + PORT);
    });
  }
}
