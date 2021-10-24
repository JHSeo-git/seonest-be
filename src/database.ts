import {
  Connection,
  ConnectionManager,
  ConnectionOptions,
  createConnection,
  getConnectionManager,
} from 'typeorm';
import entities from './entity';
// import 'mysql';

export default class Database {
  connectionManager: ConnectionManager;

  constructor() {
    this.connectionManager = getConnectionManager();
  }

  async connect() {
    const isDev = process.env.NODE_ENV !== 'production';
    const options: ConnectionOptions = {
      entities,
      type: process.env.TYPEORM_TYPE as any,
      host: process.env.TYPEORM_HOST,
      port: parseInt(process.env.TYPEORM_PORT ?? '3306', 10),
      username: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
      synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
      logging: process.env.TYPEORM_LOGGING === 'true',
      charset: 'utf8mb4',
    };

    return createConnection(options);
  }

  // prepare connection
  async getConnection(): Promise<Connection> {
    const CONNECTION_NAME = `default`;
    if (this.connectionManager.has(CONNECTION_NAME)) {
      const conn = this.connectionManager.get(CONNECTION_NAME);
      try {
        if (conn.isConnected) {
          await conn.close();
        }
      } catch {}
      return conn.connect();
    }

    return this.connect();
  }
}
