"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genAccCode = genAccCode;
function genAccCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
