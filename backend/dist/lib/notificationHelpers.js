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
exports.addNotificationToTeam = void 0;
const db_1 = __importDefault(require("../db"));
const addNotificationToTeam = (team_id, type, sender_id, message) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield db_1.default.connect();
    console.log('Adding notification to team:', { team_id, type, sender_id, message });
    try {
        yield client.query('BEGIN');
        // get user_ids of all team members
        const res = yield client.query(`SELECT user_id FROM team_memberships WHERE team_id = $1`, [team_id]);
        const user_ids = res.rows.map(row => row.user_id);
        console.log('User IDs to notify:', user_ids);
        // insert a notification for each user_id
        const insertPromises = user_ids.map((user_id) => {
            return client.query(`INSERT INTO notifications (user_id, type, sent_from_id, content)
                 VALUES ($1, $2, $3, $4)`, [user_id, type, sender_id, message]);
        });
        yield Promise.all(insertPromises);
        yield client.query('COMMIT');
    }
    catch (error) {
        console.error('Error adding notification:', error);
        yield client.query('ROLLBACK');
    }
    finally {
        client.release();
    }
});
exports.addNotificationToTeam = addNotificationToTeam;
