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

export const getTeamImgUrl = async (teamId: number): Promise<string | null> => {
    try {
        const result = await pool.query<{ team_img_name: string }>(
            `SELECT team_img_name FROM teams WHERE team_id = $1`,
            [teamId]
        );

        console.log("getTeamImgUrl result:", result.rows);

        // Need to check if the team has a null team_img_name
        if (result.rows.length === 0 || !result.rows[0].team_img_name) {
            console.warn("No team image found for team_id:", teamId);
            return null;
        }

        // Generate signed URL
        const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const signedUrl = getSignedUrl({
            url: `https://${process.env.CLOUDFRONT_DOMAIN}/${result.rows[0].team_img_name}`,
            keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
            privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!,
            dateLessThan: expirationDate
        });
        console.log("Generated signed URL for team image:", signedUrl);
        return signedUrl;
    } catch (error) {
        console.error("Error fetching team image for team:", error);
        return null;
    }
};