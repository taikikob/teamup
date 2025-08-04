import pool from '../db';
import {getSignedUrl} from "@aws-sdk/cloudfront-signer"

export const getProfilePictureUrl = async (userId: number): Promise<string | null> => {
    try {
        const result = await pool.query<{ media_name: string }>(
            `SELECT media_name FROM profile_pictures WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        // Generate signed URL
        const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const signedUrl = getSignedUrl({
            url: `https://${process.env.CLOUDFRONT_DOMAIN}/${result.rows[0].media_name}`,
            keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
            privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
            dateLessThan: expirationDate
        });

        return signedUrl;
    } catch (error) {
        console.error("Error fetching profile picture for user:", error);
        return null;
    }
};