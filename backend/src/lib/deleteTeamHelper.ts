import pool from '../db';
import { deleteFile } from "../lib/s3utils";
import { invalidateCache } from "../lib/cloudFrontUtils";
import { PoolClient } from 'pg';

export const deleteTeamHelper = async (team_id: string, client: PoolClient): Promise<void> => {
    // delete all team related data from the teams, team_memberships,
    // access_codes, mastery_nodes, mastery_edges, mastery_tasks, 
    // posts, task_submissions, task_completions, comments tables
    try {
        // first delete the media in s3 and invalidate the cache from cloudfront
        const media_name_res = await client.query(`
            SELECT media_name FROM posts 
            WHERE task_id IN (SELECT task_id FROM mastery_tasks WHERE team_id = $1)`, [team_id]);
        console.log('Media names to delete:', media_name_res.rows);
        const media_names = media_name_res.rows.map(row => row.media_name);
        await Promise.all(media_names.map(media_name => deleteFile(media_name)));
        await Promise.all(media_names.map(media_name => invalidateCache(media_name)));
        console.log('Media files deleted and cache invalidated.');
        // delete from team table
        await client.query('DELETE FROM teams WHERE team_id = $1', [team_id]);
        console.log('Team deleted from teams table.');
        // team_memberships will be deleted due to ON DELETE CASCADE
        // access_codes will be deleted due to ON DELETE CASCADE
        // mastery_nodes will be deleted due to ON DELETE CASCADE
        // mastery_edges will be deleted due to ON DELETE CASCADE
        // mastery_tas`ks will be deleted due to ON DELETE CASCADE
        // posts will be deleted due to ON DELETE CASCADE
        // task_submissions will be deleted due to ON DELETE CASCADE
        // task_completions will be deleted due to ON DELETE CASCADE
        // comments will be deleted due to ON DELETE CASCADE
    } catch (error) {``
        console.error('Error deleting team media:', error);
    } 
}