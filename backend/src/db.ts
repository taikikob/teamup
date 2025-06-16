import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'virtrain',
  password: '5GZCxega',
  port: 5432,
});

export default pool;