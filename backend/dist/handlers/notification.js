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
exports.markAsUnread = exports.markAsRead = exports.changeNotifSetting = exports.getNotifications = void 0;
const db_1 = __importDefault(require("../db"));
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const userId = user.user_id;
    try {
        const result = yield db_1.default.query(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getNotifications = getNotifications;
const changeNotifSetting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const { notifications_enabled } = req.body;
    if (typeof notifications_enabled !== 'boolean') {
        res.status(400).json({ error: 'Invalid notifications_enabled value' });
        return;
    }
    try {
        const result = yield db_1.default.query(`UPDATE users SET notifications_enabled = $1 WHERE user_id = $2 RETURNING user_id, email, username, first_name, last_name, notifications_enabled`, [notifications_enabled, user.user_id]);
        res.status(200).json(result.rows[0]);
        return;
    }
    catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.changeNotifSetting = changeNotifSetting;
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const notification_id = parseInt(req.params.id, 10);
    try {
        const result = yield db_1.default.query(`UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2 RETURNING *`, [notification_id, user.user_id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Notification not found or already read' });
            return;
        }
        res.status(200).json(result.rows[0]);
        return;
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.markAsRead = markAsRead;
const markAsUnread = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }
    const notification_id = parseInt(req.params.id, 10);
    try {
        const result = yield db_1.default.query(`UPDATE notifications SET is_read = FALSE WHERE notification_id = $1 AND user_id = $2 RETURNING *`, [notification_id, user.user_id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Notification not found or already unread' });
            return;
        }
        res.status(200).json(result.rows[0]);
        return;
    }
    catch (error) {
        console.error('Error marking notification as unread:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.markAsUnread = markAsUnread;
