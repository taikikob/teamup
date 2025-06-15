const Pool = require("pg").Pool;

// don't expose passwords in production
const pool = new Pool({
    user: "postgres",
    password: "5GZCxega",
    host: "localhost",
    port: 5432,
    database: "virtrain"
});

module.exports = pool;