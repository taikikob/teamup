import cloudFront from "../cloudFront";
import { CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";

export const invalidateCache = async (mediaName: string) => {
    if (!process.env.CLOUDFRONT_DISTRIBUTION_ID) {
        console.error('CLOUDFRONT_DISTRIBUTION_ID is not set in environment variables');
        return;
    }
    try {
        await cloudFront.send(new CreateInvalidationCommand({
            DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
            InvalidationBatch: {
                CallerReference: mediaName,
                Paths: {
                    Quantity: 1,
                    Items: [
                        `/${mediaName}`
                    ]
                }
            }
        }));
    } catch (error) {
        console.error('Error invalidating CloudFront cache:', error);
    }
};