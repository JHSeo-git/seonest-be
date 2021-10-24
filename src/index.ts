import 'dotenv/config';
import app from './app';
import Database from './database';
import { appClose } from './lib/middlewares/healthCheck';
// import 'reflect-metadata';
// import Server from './server';

// createConnection()
//   .then(async (connection) => {
//     const server = new Server();
//     server.start();
//   })
//   .catch((error) => console.log(error));

const { PORT, NODE_ENV } = process.env;
const isDev = NODE_ENV !== 'production';

const database = new Database();
database
  .getConnection()
  .then(async (connection) => {
    app.listen(PORT, () => {
      process.send?.('ready');
      if (isDev) {
        console.log('✅ Server is listening to port ' + PORT);
      }
    });

    process.on('SIGINT', () => {
      appClose();
      process.exit(0);
    });
  })
  .catch((error) => console.log(error));
