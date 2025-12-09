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

const getUserProfile = (user_id, done) => {
    const sql = `
        SELECT 
            u.user_id,
            u.first_name,
            u.last_name,
            json_group_array(json_object(
                'item_id', i.item_id,
                'name', i.name,
                'description', i.description,
                'end_date', i.end_date,
                'creator_id', i.creator_id,
                'first_name', uc.first_name,
                'last_name', uc.last_name
            )) as selling
        FROM users u
        LEFT JOIN items i ON u.user_id = i.creator_id
        LEFT JOIN users uc ON i.creator_id = uc.user_id
        WHERE u.user_id = ?
        GROUP BY u.user_id
    `;

    db.get(sql, [user_id], (err, row) => {
        if (err || !row) return done(err, row);
        
        // Parse JSON strings back to arrays
        row.selling = row.selling ? JSON.parse(row.selling).filter(item => item.item_id !== null) : [];
        
        // Get items user is bidding on
        const biddingSql = `
            SELECT DISTINCT
                i.item_id,
                i.name,
                i.description,
                i.end_date,
                i.creator_id,
                uc.first_name,
                uc.last_name
            FROM items i
            JOIN bids b ON i.item_id = b.item_id
            LEFT JOIN users uc ON i.creator_id = uc.user_id
            WHERE b.user_id = ?
            ORDER BY i.item_id
        `;
        
        db.all(biddingSql, [user_id], (err2, bidding) => {
            if (err2) return done(err2);
            row.bidding_on = bidding || [];
            
            // Get auctions that have ended
            const timestamp = Math.floor(Date.now() / 1000);
            const endedSql = `
                SELECT 
                    i.item_id,
                    i.name,
                    i.description,
                    i.end_date,
                    i.creator_id,
                    uc.first_name,
                    uc.last_name
                FROM items i
                LEFT JOIN users uc ON i.creator_id = uc.user_id
                WHERE i.creator_id = ? AND i.end_date <= ?
                ORDER BY i.item_id
            `;
            
            db.all(endedSql, [user_id, timestamp], (err3, ended) => {
                if (err3) return done(err3);
                row.auctions_ended = ended || [];
                return done(null, row);
            });
        });
    });
}

module.exports = {
    getHash,
    getUser,
    createAccount,
    getUserByEmail,
    getUserProfile
}