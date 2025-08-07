import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import pool from './db';
import { validPassword } from './lib/passwordUtils';

// name of field that I want passport to look for username and password in request
const customFields = {
    usernameField: 'username',
    passwordField: 'password'
}


// the login post request to express API should have a username and password field
// passport will automatically grab those fields from the post request, and populate the username
// and password parameters of this function
// done is a function that I will eventually pass the results of my authentication into
const verifyCallback = async (username: string, password: string, done: Function) => {
    try {
        if (!username) {
            return done(null, false, { message: "Username not provided" });
        }
        if (!password) {
            return done(null, false, { message: "Password not provided" });
        }

        const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (userResult.rows.length === 0) {
            return done(null, false, { message: "Username does not exist" });
        }

        const user = userResult.rows[0];
        const isValid = validPassword(password, user.password_hash, user.salt);
        if (!isValid) {
            return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
};

const strategy = new LocalStrategy(customFields, verifyCallback);

passport.use(strategy);

passport.serializeUser((user: any, done) => {
  console.log("Serializing user:", user);
  done(null, user.user_id); // will throw if user.id is undefined
});

interface DeserializedUser {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
}

passport.deserializeUser(async (userId:number, done) => {
    try {

    const id = Number(userId);
    if (isNaN(id)) return done(new Error("Invalid user ID type"));

    const result = await pool.query(
      'SELECT user_id, username, first_name, last_name FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return done(new Error("User not found"));
    }

    const user:DeserializedUser = result.rows[0];
    return done(null, user); // attaches user to req.user
  } catch (err) {
    return done(err);
  }
})

export default passport;