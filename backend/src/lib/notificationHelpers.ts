import pool from '../db';

export const addNotificationToTeam = async (team_id: string, type: string, sender_id: number, message: string): Promise<void> => {
    const client = await pool.connect();
    console.log('Adding notification to team:', { team_id, type, sender_id, message });
    try {
        await client.query('BEGIN');
        // get user_ids of all team members
        const res = await client.query(
            `SELECT user_id FROM team_memberships WHERE team_id = $1`, [team_id]);
        const user_ids = res.rows.map(row => row.user_id);
        console.log('User IDs to notify:', user_ids);
        // insert a notification for each user_id
        const insertPromises = user_ids.map((user_id: number) => {
            return client.query(
                `INSERT INTO notifications (user_id, type, sent_from_id, content)
                 VALUES ($1, $2, $3, $4)`,
                [user_id, type, sender_id, message]
            );
        });
        await Promise.all(insertPromises);
        await client.query('COMMIT');
    } catch (error) {
        console.error('Error adding notification:', error);
        await client.query('ROLLBACK');
    } finally {
        client.release();
    }
}