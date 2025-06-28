import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import pool from './db';
import { validPassword } from './lib/passwordUtils';

// name of field that I want passport to look for username and password in request
const customFields = {
    usernameField: 'email',
    passwordField: 'password'
}


// the login post request to express API should have a username and password field
// passport will automatically grab those fields from the post request, and populate the username
// and password parameters of this function
// done is a function that I will eventually pass the results of my authentication into
const verifyCallback = async (email:string, password:string, done:Function) => {
    // own implementation of a password verification
    try {
        const user = await pool.query("SELECT * FROM users WHERE email = $1",
            [email]
        );
        // the null paramter in the done function means that there was no error
        if (user.rows.length === 0) {
            // no user found with given email
            // this done function will result in passport returning an unauthorized error on HTTP status
            return done(null, false)
        }
        const isValid = validPassword(password, user.rows[0].password_hash, user.rows[0].salt);
        if (isValid) {
            return done(null, user.rows[0]);
        } else {
            return done(null, false);
        }
    } catch (error) {
        done(error);
    }
}

const strategy = new LocalStrategy(customFields, verifyCallback);

passport.use(strategy);

passport.serializeUser((user: any, done) => {
  console.log("Serializing user:", user);
  done(null, user.user_id); // will throw if user.id is undefined
});

interface DeserializedUser {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

passport.deserializeUser(async (userId:number, done) => {
    try {

    const id = Number(userId);
    if (isNaN(id)) return done(new Error("Invalid user ID type"));

    const result = await pool.query(
      'SELECT user_id, email, first_name, last_name FROM users WHERE user_id = $1',
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