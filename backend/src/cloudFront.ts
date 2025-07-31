import { CloudFrontClient } from "@aws-sdk/client-cloudfront";

const cloudFront = new CloudFrontClient({
    credentials: {
        accessKeyId: process.env.BUCKET_ACCESS_KEY!,
        secretAccessKey: process.env.BUCKET_SECRET_KEY!
    }
});

export default cloudFront;