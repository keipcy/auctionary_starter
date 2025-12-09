const db = require("../../database")

// helper functions

const getUserIdFromToken = (session_token, done) => {
    const sql = "SELECT user_id FROM users WHERE session_token = ?"

    db.get(sql, [session_token], (err, row) => {
        return done(err, row)
    })
}

// implementation

const addItem = (item_name, description, starting_bid, end_date, creator_id, done) => {
    const start_date = Math.floor(Date.now() / 1000)

    if (end_date <= start_date) {
        return done(new Error("end_date must be greater than start_date"))
    }

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

    db.get(sql, [item_id], (err, item) => {
        if (err) return done(err)
        if (!item) return done(new Error("Item not found"))

        if (timestamp >= item.end_date) {
            return done(new Error("Auction has ended"))
        }

        if (item.creator_id === user_id) {
            return done(new Error("Cannot bid on your own item"))
        }

        let minimumBid;
        if(item.highest_bid) {
            minimumBid = item.highest_bid + 1;
        } else {
            minimumBid = item.starting_bid;
        }

        if (amount < minimumBid) {
            return done(new Error(`Bid must be at least ${minimumBid}`))
        }

        // INSERT moved INSIDE the callback, after all validation
        const sql2 = "INSERT INTO bids (item_id, user_id, amount, timestamp) VALUES (?, ?, ?, ?)"
        const values = [item_id, user_id, amount, timestamp]

        db.run(sql2, values, function(err){
            if(err) return done(err)
            return done(null)
        })
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
        ORDER BY b.timestamp DESC
    `

    db.all(sql, [item_id], (err, rows) => {
        return done(err, rows)
    })
}

module.exports = {
    getUserIdFromToken,
    addItem,
    getItemFromId,
    bidOnItem,
    getAllBidsForItem
}