// utilty functions for working with S3
import s3 from "../s3";

import {DeleteObjectCommand } from "@aws-sdk/client-s3";

export const deleteFile = async (key: string) => {
    if (!process.env.BUCKET_NAME) {
        throw new Error("Bucket name is not defined in environment variables");
    }
    const command = new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key
    });
    return s3.send(command);
};