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
exports.deleteFile = void 0;
// utilty functions for working with S3
const s3_1 = __importDefault(require("../s3"));
const client_s3_1 = require("@aws-sdk/client-s3");
const deleteFile = (key) => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.BUCKET_NAME) {
        throw new Error("Bucket name is not defined in environment variables");
    }
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key
    });
    return s3_1.default.send(command);
});
exports.deleteFile = deleteFile;
