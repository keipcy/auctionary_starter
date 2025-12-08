const db = require("../../database")
const crypto = require("crypto")

const getHash = function(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 256, 'sha256').toString('hex')
}

const getUser = (user_id, done) => {
    const sql = "SELECT user_id, first_name, last_name, email FROM users WHERE user_id = ?"

    db.get(sql, [user_id], (err, row) => {
        return done(err, row)
    })
}

const createAccount = (first_name, last_name, email, password, done) => {
    const salt = crypto.randomBytes(64);
    const hash = getHash(password, salt)

    const sql = 'INSERT INTO users (first_name, last_name, email, password, salt) VALUES (?, ?, ?, ?, ?)'
    const values = [first_name, last_name, email, hash, salt.toString('hex')]

    db.run(sql, values, function(err){
        if(err) return done(err)
        return done(null, this.lastID)
    })
}

const getUserByEmail = (email, done) => {
    const sql = 'SELECT user_id, password, salt FROM users WHERE email = ?'
    
    db.get(sql, [email], (err, row) => {
        return done(err, row)
    })
}

module.exports = {
    getHash: getHash,
    getUser: getUser,
    createAccount: createAccount,
    getUserByEmail: getUserByEmail
}