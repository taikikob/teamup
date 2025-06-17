declare module 'connect-pg-simple' {
  import { Store } from 'express-session';
  import { Pool } from 'pg';

  interface PgSimpleOptions {
    pool?: Pool;
    conString?: string;
    tableName?: string;
    ttl?: number;
    schemaName?: string;
    pruneSessionInterval?: false | number;
    errorLog?: (...args: any[]) => void;
  }

  function connectPgSimple(session: { Store: typeof Store }): {
    new (options?: PgSimpleOptions): Store;
  };

  export = connectPgSimple;
}