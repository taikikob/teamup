CREATE DATABASE virtrain;

-- Create schema down below
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email varchar UNIQUE NOT NULL,
  password_hash varchar NOT NULL,
  salt varchar NOT NULL,
  first_name varchar NOT NULL,
  last_name varchar NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  team_id SERIAL PRIMARY KEY,
  team_name varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS team_memberships (
  team_id integer REFERENCES teams(team_id) ON DELETE CASCADE,
  user_id integer REFERENCES users(user_id) ON DELETE CASCADE,
  role varchar CHECK (role IN ('player', 'coach')) NOT NULL,
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS access_codes (
  team_id integer REFERENCES teams(team_id) ON DELETE CASCADE,
  code varchar PRIMARY KEY,
  expires_at TIMESTAMP
);





-- Creates a table named `"sessions"` **only if it doesn't already exist**.
-- The quotes around `"session"` are necessary because `session` is a **reserved keyword** in SQL.
-- This table will store **user session data** for myt app.

-- sid is a unique identifier for the session.
-- sess is a JSON object that contains session data.
-- expire is a timestamp that indicates when the session will expire.

CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar PRIMARY KEY NOT NULL,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
);

-- This index makes it faster to look up sessions by their expiration time.
CREATE INDEX "IDX_session_expire" ON "sessions" ("expire");
