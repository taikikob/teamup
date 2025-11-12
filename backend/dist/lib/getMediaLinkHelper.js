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
exports.getTeamImgUrl = exports.getProfilePictureUrl = void 0;
const db_1 = __importDefault(require("../db"));
const cloudfront_signer_1 = require("@aws-sdk/cloudfront-signer");
const getProfilePictureUrl = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.default.query(`SELECT media_name FROM profile_pictures WHERE user_id = $1`, [userId]);
        if (result.rows.length === 0) {
            return null;
        }
        // Generate signed URL
        const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const signedUrl = (0, cloudfront_signer_1.getSignedUrl)({
            url: `https://${process.env.CLOUDFRONT_DOMAIN}/${result.rows[0].media_name}`,
            keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
            privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
            dateLessThan: expirationDate
        });
        return signedUrl;
    }
    catch (error) {
        console.error("Error fetching profile picture for user:", error);
        return null;
    }
});
exports.getProfilePictureUrl = getProfilePictureUrl;
const getTeamImgUrl = (teamId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.default.query(`SELECT team_img_name FROM teams WHERE team_id = $1`, [teamId]);
        console.log("getTeamImgUrl result:", result.rows);
        // Need to check if the team has a null team_img_name
        if (result.rows.length === 0 || !result.rows[0].team_img_name) {
            console.warn("No team image found for team_id:", teamId);
            return null;
        }
        // Generate signed URL
        const expirationDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const signedUrl = (0, cloudfront_signer_1.getSignedUrl)({
            url: `https://${process.env.CLOUDFRONT_DOMAIN}/${result.rows[0].team_img_name}`,
            keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
            privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
            dateLessThan: expirationDate
        });
        console.log("Generated signed URL for team image:", signedUrl);
        return signedUrl;
    }
    catch (error) {
        console.error("Error fetching team image for team:", error);
        return null;
    }
});
exports.getTeamImgUrl = getTeamImgUrl;
