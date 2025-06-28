import crypto from 'crypto';

// password utility functions
function genPassword(password:string) {
    const salt = crypto.randomBytes(32).toString('hex');
    const genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    return {
        salt: salt,
        hash: genHash
    };
}

function validPassword(password:string, hash:string, salt:string) {
    const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hashVerify === hash;
}

export { genPassword, validPassword };