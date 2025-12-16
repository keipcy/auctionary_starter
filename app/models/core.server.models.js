const db = require("../../database")

// implementation

const addItem = (item_name, description, starting_bid, start_date, end_date, creator_id, done) => {
    const sql = "INSERT INTO items (name, description, starting_bid, start_date, end_date, creator_id) VALUES (?, ?, ?, ?, ?, ?)"
    const values = [item_name, description, starting_bid, start_date, end_date, creator_id]

    db.run(sql, values, function(err){
        if(err) return done(err)
        return done(null, this.lastID)
    })
}

const getItemFromId = (item_id, done) => {
    const sql = `
        SELECT 
            i.item_id,
            i.name,
            i.description,
            i.starting_bid,
            i.start_date,
            i.end_date,
            i.creator_id,
            uc.first_name AS creator_first_name,
            uc.last_name  AS creator_last_name,
            cb.amount     AS current_bid,
            cb.user_id    AS current_bid_holder_id,
            ub.first_name AS current_bid_holder_first,
            ub.last_name  AS current_bid_holder_last
        FROM items i
        LEFT JOIN users uc ON i.creator_id = uc.user_id
        LEFT JOIN (
            SELECT b1.item_id, b1.user_id, b1.amount
            FROM bids b1
            WHERE b1.item_id = ?
            ORDER BY b1.timestamp DESC, b1.amount DESC
            LIMIT 1
        ) cb ON cb.item_id = i.item_id
        LEFT JOIN users ub ON ub.user_id = cb.user_id
        WHERE i.item_id = ?
    `;

    db.get(sql, [item_id, item_id], (err, row) => {
        return done(err, row)
    })
}

const bidOnItem = (item_id, user_id, amount, done) => {
    const timestamp = Math.floor(Date.now() / 1000)
    const sql = "INSERT INTO bids (item_id, user_id, amount, timestamp) VALUES (?, ?, ?, ?)"
    const values = [item_id, user_id, amount, timestamp]

    db.run(sql, values, function(err){
        if(err) return done(err)
        return done(null)
    })
}

const getItemValidationData = (item_id, done) => {
    const sql = `
        SELECT 
            i.item_id, 
            i.end_date, 
            i.creator_id, 
            i.starting_bid,
            MAX(b.amount) as highest_bid
        FROM items i
        LEFT JOIN bids b ON i.item_id = b.item_id
        WHERE i.item_id = ?
        GROUP BY i.item_id
    `

    db.get(sql, [item_id], (err, row) => {
        return done(err, row)
    })
}

const itemExists = (item_id, done) => {
    const sql = "SELECT item_id FROM items WHERE item_id = ?"

    db.get(sql, [item_id], (err, row) => {
        return done(err, row)
    })
}

const getAllBidsForItem = (item_id, done) => {
    const sql = `
        SELECT 
            b.item_id,
            b.amount,
            b.timestamp,
            b.user_id,
            u.first_name,
            u.last_name
        FROM bids b
        LEFT JOIN users u ON b.user_id = u.user_id
        WHERE b.item_id = ?
        ORDER BY b.timestamp DESC, b.amount DESC
    `

    db.all(sql, [item_id], (err, rows) => {
        return done(err, rows)
    })
}

const searchItems = (limit, offset, whereConditions, whereParams, done) => {
    let sql = `
        SELECT 
            i.item_id,
            i.name,
            i.description,
            i.end_date,
            i.creator_id,
            u.first_name,
            u.last_name
        FROM items i
        LEFT JOIN users u ON i.creator_id = u.user_id
    `

    // Add WHERE clause if there are conditions
    if (whereConditions.length > 0) {
        sql += ` WHERE ` + whereConditions.join(' AND ')
    }

    sql += ` LIMIT ? OFFSET ?`
    
    const params = [...whereParams, limit, offset]

    db.all(sql, params, (err, rows) => {
        return done(err, rows)
    })
}

module.exports = {
    addItem,
    getItemFromId,
    bidOnItem,
    getItemValidationData,
    getAllBidsForItem,
    itemExists,
    searchItems
}