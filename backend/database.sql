CREATE DATABASE teamup;

-- Create schema down below
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email varchar UNIQUE NOT NULL,
  password_hash varchar NOT NULL,
  salt varchar NOT NULL,
  first_name varchar NOT NULL,
  last_name varchar NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
);

CREATE TABLE IF NOT EXISTS teams (
  team_id SERIAL PRIMARY KEY,
  team_name varchar NOT NULL,
  team_description varchar,
  team_img_name varchar,
);

CREATE TABLE IF NOT EXISTS team_memberships (
  team_id integer REFERENCES teams(team_id) ON DELETE CASCADE,
  user_id integer REFERENCES users(user_id) ON DELETE CASCADE,
  role varchar CHECK (role IN ('Player', 'Coach')) NOT NULL,
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS access_codes (
  team_id integer REFERENCES teams(team_id) ON DELETE CASCADE,
  code varchar PRIMARY KEY,
  role VARCHAR CHECK (role IN ('Player', 'Coach')) NOT NULL,
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mastery_nodes (
    node_id VARCHAR NOT NULL,
    team_id INTEGER NOT NULL,
    label VARCHAR(255) NOT NULL,
    pos_x FLOAT NOT NULL,
    pos_y FLOAT NOT NULL,
    -- Add other fields as needed (e.g., type, metadata)
    PRIMARY KEY (node_id, team_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- Index for faster lookup by team
CREATE INDEX IF NOT EXISTS idx_react_flow_nodes_team_id ON mastery_nodes (team_id);

CREATE TABLE IF NOT EXISTS mastery_edges (
    edge_id VARCHAR NOT NULL,
    team_id INTEGER NOT NULL,
    source_node_id VARCHAR NOT NULL,
    target_node_id VARCHAR NOT NULL,
    -- Add other fields as needed (e.g., type, label)
    PRIMARY KEY (team_id, edge_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id, source_node_id) REFERENCES mastery_nodes(team_id, node_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id, target_node_id) REFERENCES mastery_nodes(team_id, node_id) ON DELETE CASCADE
);

-- Index for faster lookup by team
CREATE INDEX IF NOT EXISTS idx_react_flow_edges_team_id ON mastery_edges (team_id);

CREATE TABLE IF NOT EXISTS mastery_tasks (
    task_id SERIAL PRIMARY KEY, -- Unique ID for each individual task
    node_id VARCHAR NOT NULL,
    team_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL, -- Title of the specific task
    task_order INTEGER NOT NULL,       -- The order of this task within its node (e.g., 1, 2, 3)
    description TEXT,                   -- Optional: A detailed description of the level

    -- Foreign Key to the mastery_nodes table to ensure levels are linked to existing nodes within the same team
    FOREIGN KEY (node_id, team_id) REFERENCES mastery_nodes(node_id, team_id) ON DELETE CASCADE
);

-- Index for faster lookup of tasks by node and team
CREATE INDEX IF NOT EXISTS idx_mastery_tasks_node_team ON mastery_tasks (node_id, team_id);

-- Index for faster lookup of tasks by team (e.g., to get all tasks for a team)
CREATE INDEX IF NOT EXISTS idx_mastery_tasks_team_id ON mastery_tasks (team_id);

CREATE TABLE IF NOT EXISTS posts (
    post_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    caption TEXT,
    media_name VARCHAR(255) NOT NULL, -- Name of the media file
    media_type VARCHAR(50) NOT NULL, -- e.g., 'coach_resource', 'player_submission'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    media_format VARCHAR(20) NOT NULL, -- 'image', 'video', 'other'
    FOREIGN KEY (task_id) REFERENCES mastery_tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_pictures (
  user_id INTEGER PRIMARY KEY,
  media_name VARCHAR(255) NOT NULL, -- Name of the media file
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_submissions (
  player_id INTEGER NOT NULL,
  task_id INTEGER NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, task_id),
  FOREIGN KEY (player_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES mastery_tasks(task_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_completions (
  player_id INTEGER NOT NULL,
  task_id INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Changed to NOT NULL and default
  PRIMARY KEY (player_id, task_id),
  FOREIGN KEY (player_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES mastery_tasks(task_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    comment_id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES mastery_tasks(task_id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_player_task ON comments (player_id, task_id);
CREATE INDEX idx_comments_created_at ON comments (created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g., 'task_completed', 'comment_added', 'player_removed', 'team_deleted'
  sent_from_id INTEGER NOT NULL, -- User who sent the notification
  content TEXT NOT NULL, -- Content of the notification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  team_id INTEGER, -- Team related to the notification, can be NULL
  node_id VARCHAR, -- Node related to the notification, can be NULL
  task_id INTEGER, -- Task related to the notification, can be NULL
  is_read boolean DEFAULT false,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (sent_from_id) REFERENCES users(user_id),
);

CREATE INDEX idx_notifications_user_created_at ON notifications (user_id, created_at DESC);


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
