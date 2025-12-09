const user = require("../models/user.server.models")
const Joi = require("joi")
const crypto = require("crypto")
const db = require("../../database")

// functions

const getHash = function(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 256, 'sha256').toString('hex')
}

// user management

const create_account = (req, res) => {
    const schema = Joi.object({
        first_name: Joi.string().min(1).required(),
        last_name: Joi.string().min(1).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(9).max(40).required()
    });

    const { error, value } = schema.validate(req.body);
    
    if(error) {
        return res.status(400).json({ error_message: error.details[0].message });
    }

    user.createAccount(value.first_name, value.last_name, value.email, value.password, (err, user_id) => {
        if(err) return res.status(400).json({ error_message: 'Email already exists' });
        return res.status(201).json({ user_id: user_id });
    });
}

const login = (req, res) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);
    if(error) return res.status(400).json({error_message: error.details[0].message});

    user.getUserByEmail(value.email, (err, row) => {
        if(err || !row) return res.status(400).json({error_message: "Invalid email or password"})

        const salt = Buffer.from(row.salt, 'hex');
        const hash = getHash(value.password, salt);

        if(row.password !== hash) return res.status(400).json({error_message: 'Invalid email or password'})

        const session_token = crypto.randomBytes(32).toString('hex');
        const sql = 'UPDATE users SET session_token = ? WHERE user_id = ?';

        db.run(sql, [session_token, row.user_id], (err) => {
            if(err) return res.status(500).json({error_message: 'Server error'});
            return res.status(200).json({
                user_id: row.user_id,
                session_token: session_token
            });
        });
    });
}

const logout = (req, res) => {
    const session_token = req.get('X-Authorization');

    if(!session_token) return res.status(401).json({error_message: "No session token"});

    const sql = 'UPDATE users SET session_token = NULL WHERE session_token = ?';

    db.run(sql, [session_token], function(err) {
        if(err) return res.status(500).json({error_message: 'Server error'});
        if(this.changes === 0) return res.status(401).json({error_message: 'Invalid session token'});
        return res.status(200).json({message: 'Logged out successfully'})
    })
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
    logout: logout
}