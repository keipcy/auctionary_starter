const user = require("../models/user.server.models")
const Joi = require("joi")
const crypto = require("crypto")

// functions

const getHash = function(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 256, 'sha256').toString('hex')
}

// user management

const get_user = (req, res) => {
    let id = parseInt(req.params.user_id)
    if(isNaN(id) || id <= 0) return res.status(400).json({ error_message: 'Invalid user id'})

    user.getUserProfile(id, (err, row) => {
        if(err) return res.status(500).json({ error_message: 'Server error' });
        if(!row) return res.status(404).json({ error_message: 'User not found' });
        return res.status(200).json(row);
    })
}

const create_account = (req, res) => {
    const schema = Joi.object({
        first_name: Joi.string().min(1).required(),
        last_name: Joi.string().min(1).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(37).pattern(/[0-9]/).pattern(/[A-Z]/).pattern(/[a-z]/).required()
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

        // If user already has a session token, return it; otherwise generate new one
        let session_token = row.session_token;
        
        if(!session_token) {
            session_token = crypto.randomBytes(32).toString('hex');
            
            user.updateSessionToken(session_token, row.user_id, (err) => {
                if(err) return res.status(500).json({error_message: 'Server error'});
                return res.status(200).json({
                    user_id: row.user_id,
                    session_token: session_token
                });
            });
        } else {
            return res.status(200).json({
                user_id: row.user_id,
                session_token: session_token
            });
        }
    });
}

const logout = (req, res) => {
    const session_token = req.get('X-Authorization');

    if(!session_token) return res.status(401).json({error_message: "No session token"});

    user.clearSessionToken(session_token, (err, changes) => {
        if(err) return res.status(500).json({error_message: 'Server error'});
        if(changes === 0) return res.status(401).json({error_message: 'Invalid session token'});
        return res.status(200).json({message: 'Logged out successfully'})
    })
}

module.exports = {
    create_account,
    login,
    logout,
    get_user
}