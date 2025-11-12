"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateCache = void 0;
const cloudFront_1 = __importDefault(require("../cloudFront"));
const client_cloudfront_1 = require("@aws-sdk/client-cloudfront");
const invalidateCache = (mediaName) => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.CLOUDFRONT_DISTRIBUTION_ID) {
        console.error('CLOUDFRONT_DISTRIBUTION_ID is not set in environment variables');
        return;
    }
    try {
        yield cloudFront_1.default.send(new client_cloudfront_1.CreateInvalidationCommand({
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
    }
    catch (error) {
        console.error('Error invalidating CloudFront cache:', error);
    }
});
exports.invalidateCache = invalidateCache;
