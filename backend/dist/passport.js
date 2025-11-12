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
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const db_1 = __importDefault(require("./db"));
const passwordUtils_1 = require("./lib/passwordUtils");
// name of field that I want passport to look for username and password in request
const customFields = {
    usernameField: 'username',
    passwordField: 'password'
};
// the login post request to express API should have a username and password field
// passport will automatically grab those fields from the post request, and populate the username
// and password parameters of this function
// done is a function that I will eventually pass the results of my authentication into
const verifyCallback = (username, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!username) {
            return done(null, false, { message: "Username not provided" });
        }
        if (!password) {
            return done(null, false, { message: "Password not provided" });
        }
        const userResult = yield db_1.default.query("SELECT * FROM users WHERE username = $1", [username]);
        if (userResult.rows.length === 0) {
            return done(null, false, { message: "Username does not exist" });
        }
        const user = userResult.rows[0];
        const isValid = (0, passwordUtils_1.validPassword)(password, user.password_hash, user.salt);
        if (!isValid) {
            return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error);
    }
});
const strategy = new passport_local_1.Strategy(customFields, verifyCallback);
passport_1.default.use(strategy);
passport_1.default.serializeUser((user, done) => {
    console.log("Serializing user:", user);
    done(null, user.user_id); // will throw if user.id is undefined
});
passport_1.default.deserializeUser((userId, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = Number(userId);
        if (isNaN(id))
            return done(new Error("Invalid user ID type"));
        const result = yield db_1.default.query('SELECT user_id, username, email, first_name, last_name, notifications_enabled FROM users WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) {
            return done(new Error("User not found"));
        }
        const user = result.rows[0];
        return done(null, user); // attaches user to req.user
    }
    catch (err) {
        return done(err);
    }
}));
exports.default = passport_1.default;
