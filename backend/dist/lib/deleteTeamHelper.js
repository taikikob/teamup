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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTeamHelper = void 0;
const s3utils_1 = require("../lib/s3utils");
const cloudFrontUtils_1 = require("../lib/cloudFrontUtils");
const deleteTeamHelper = (team_id, client) => __awaiter(void 0, void 0, void 0, function* () {
    // delete all team related data from the teams, team_memberships,
    // access_codes, mastery_nodes, mastery_edges, mastery_tasks, 
    // posts, task_submissions, task_completions, comments tables
    try {
        // first delete the media in s3 and invalidate the cache from cloudfront
        const media_name_res = yield client.query(`
            SELECT media_name FROM posts 
            WHERE task_id IN (SELECT task_id FROM mastery_tasks WHERE team_id = $1)`, [team_id]);
        console.log('Media names to delete:', media_name_res.rows);
        const media_names = media_name_res.rows.map(row => row.media_name);
        yield Promise.all(media_names.map(media_name => (0, s3utils_1.deleteFile)(media_name)));
        yield Promise.all(media_names.map(media_name => (0, cloudFrontUtils_1.invalidateCache)(media_name)));
        console.log('Media files deleted and cache invalidated.');
        // delete from team table
        yield client.query('DELETE FROM teams WHERE team_id = $1', [team_id]);
        console.log('Team deleted from teams table.');
        // team_memberships will be deleted due to ON DELETE CASCADE
        // access_codes will be deleted due to ON DELETE CASCADE
        // mastery_nodes will be deleted due to ON DELETE CASCADE
        // mastery_edges will be deleted due to ON DELETE CASCADE
        // mastery_tas`ks will be deleted due to ON DELETE CASCADE
        // posts will be deleted due to ON DELETE CASCADE
        // task_submissions will be deleted due to ON DELETE CASCADE
        // task_completions will be deleted due to ON DELETE CASCADE
        // comments will be deleted due to ON DELETE CASCADE
    }
    catch (error) {
        ``;
        console.error('Error deleting team media:', error);
    }
});
exports.deleteTeamHelper = deleteTeamHelper;
