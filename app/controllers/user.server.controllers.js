// const user = require("./app/models/user.server.models")

// functions

const getHash = function(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 256, 'sha256').toString('hex')
}

// user management

const create_account = (req, res) => {
    const salt = crypto.randomBytes(64);
    const hash = getHash(user.password, salt)

    const sql = 'INSERT INTO users (first_name, last_name, email, password, salt) VALUES (?, ?, ?, ?, ?)'
    let values = [user.first_name, user.last_name, user.email, hash, salt.toString('hex')]

    db.run(sql, values, function(err){
        if(err) return done(err)
    })
}

const login = (email, password, done) => {
    const sql = 'SELECT user_id, password, salt FROM users WHERE email_id = ?'

    db.get(sql, [email], (err, row) => {
        if(err) return done(err)
        if(!row) return done(404) // wrong email

        if(row.salt === null) row.salt = ''

        let salt = Buffer.from(row.salt, 'hex')

        if(row.password === getHash(password, salt)) {
            return done(false, row.user_id)
        } else {
            return done(404) // wrong password
        }
    })
    return res.sendStatus(500)
}

const logout = (req, res) => {
    return res.sendStatus(500)
}

// auction manangement

const new_item = (req, res) => {
    return res.sendStatus(500)
}

const get_item = (req, res) => {
    return res.sendStatus(500)
}

const bid_item = (req, res) => {
    return res.sendStatus(500)
}

const bid_history = (req, res) => {
    return res.sendStatus(500)
}

// question management

const get_questions = (req, res) => {
    return res.sendStatus(500)
}

const ask_question = (req, res) => {
    return res.sendStatus(500)
}

const answer_question = (req, res) => {
    return res.sendStatus(500)
}

module.exports = {
    create_account: create_account,
    login: login,
    logout: logout,
    new_item: new_item,
    get_item: get_item,
    bid_item: bid_item,
    bid_history: bid_history,
    get_questions: get_questions,
    ask_question: ask_question,
    answer_question: answer_question
}