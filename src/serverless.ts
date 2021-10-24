import serverless, { Handler } from 'serverless-http';
import app from './app';
import Database from './database';

const slsApp = serverless(app);

export const handler: Handler = async (event, context) => {
  const database = new Database();
  const connection = await database.getConnection();

  const result = await slsApp(event, context);

  // sls connectless... and so..? disconnect
  try {
    await Promise.all([connection.close()]);
  } catch (e) {}

  return result;
};
