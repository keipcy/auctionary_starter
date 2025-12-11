const core = require("../models/core.server.models")
const Joi = require("joi")

// auction manangement

const new_item = (req, res) => {
    const session_token = req.get('X-Authorization');
    if (!session_token) return res.status(401).json({ error_message: "No session token available" })

    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        starting_bid: Joi.number().min(0).required(),
        end_date: Joi.number().required()
    })

    const { error, value } = schema.validate(req.body)
    if(error) return res.status(400).json({error_message: error.details[0].message});

    const start_date = Math.floor(Date.now() / 1000)

    if (value.end_date <= start_date) {
        return res.status(400).json({ error_message: "end_date must be greater than start_date" })
    }

    core.getUserIdFromToken(session_token, (err, row) => {
        if (err) return res.status(500).json({ error_message: "Server error" })
        if (!row) return res.status(401).json({ error_message: "Invalid session" })

        core.addItem(value.name, value.description, value.starting_bid, start_date, value.end_date, row.user_id, (err2, item_id) => {
            if (err2) return res.status(500).json({ error_message: err2.message })
            return res.status(201).json({ item_id })
        })
    });
}

const get_item = (req, res) => {
    const id = parseInt(req.params.item_id);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error_message: 'Invalid item id' });

    core.getItemFromId(id, (err, row) => {
        if (err) return res.status(500).json({ error_message: 'Server error' });
        if (!row) return res.status(404).json({ error_message: 'Item not found' });

        return res.status(200).json({
            item_id: row.item_id,
            name: row.name,
            description: row.description,
            starting_bid: row.starting_bid,
            start_date: row.start_date,
            end_date: row.end_date,
            creator_id: row.creator_id,
            first_name: row.creator_first_name,
            last_name: row.creator_last_name,
            current_bid: row.current_bid || row.starting_bid,
            current_bid_holder: row.current_bid_holder_id
                ? {
                    user_id: row.current_bid_holder_id,
                    first_name: row.current_bid_holder_first,
                    last_name: row.current_bid_holder_last
                }
                : null
        });
    });
}

const bid_item = (req, res) => {
    let id = parseInt(req.params.item_id)
    if(isNaN(id) || id <= 0) return res.status(400).json({ error_message: 'Invalid item id'})

    const session_token = req.get('X-Authorization');
    if (!session_token) return res.status(401).json({ error_message: "No session token available" })

    const schema = Joi.object({
        amount: Joi.number().min(0).required()
    })

    const { error, value } = schema.validate(req.body)
    if(error) return res.status(400).json({error_message: error.details[0].message});

    core.getUserIdFromToken(session_token, (err, row) => {
        if (err) return res.status(500).json({ error_message: "Server error" })
        if (!row) return res.status(401).json({ error_message: "Invalid session" })
        
        const user_id = row.user_id

        core.getItemValidationData(id, (err, item) => {
            if (err) return res.status(500).json({ error_message: "Server error" })
            if (!item) return res.status(404).json({ error_message: "Item not found" })

            const timestamp = Math.floor(Date.now() / 1000)

            if (timestamp >= item.end_date) {
                return res.status(400).json({ error_message: "Auction has ended" })
            }

            if (item.creator_id === user_id) {
                return res.status(403).json({ error_message: "Cannot bid on your own item" })
            }

            let minimumBid;
            if(item.highest_bid) {
                minimumBid = item.highest_bid + 1;
            } else {
                minimumBid = item.starting_bid + 1;
            }

            if (value.amount < minimumBid) {
                return res.status(400).json({ error_message: `Bid must be at least ${minimumBid}` })
            }

            core.bidOnItem(id, user_id, value.amount, (err2) => {
                if (err2) return res.status(500).json({ error_message: "Server error" })
                return res.status(201).json({ message: "Bid successfully created" })
            })
        })
    })
}

const bid_history = (req, res) => {
    let id = parseInt(req.params.item_id)
    if(isNaN(id) || id <= 0) return res.status(400).json({ error_message: 'Invalid item id'})

    core.itemExists(id, (err, item) => {
        if (err) return res.status(500).json({ error_message: "Server error" })
        if (!item) return res.status(404).json({ error_message: "Item not found" })

        core.getAllBidsForItem(id, (err2, rows) => {
            if (err2) return res.status(500).json({ error_message: "Server error" })
            if (!rows || rows.length === 0) return res.status(200).json([])
            return res.status(200).json(rows)
        })
    })
}

const search = (req, res) => {
    let limit = parseInt(req.query.limit) || 10
    let offset = parseInt(req.query.offset) || 0
    let status = req.query.status || null
    let query = req.query.q || null

    if (limit < 0) limit = 10
    if (offset < 0) offset = 0

    // Validate status
    if (status && !['OPEN', 'BID', 'ARCHIVE'].includes(status)) {
        return res.status(400).json({ error_message: "Invalid status. Must be OPEN, BID, or ARCHIVE" })
    }

    // Check authentication if status is OPEN or BID
    if ((status === 'OPEN' || status === 'BID') && !req.get('X-Authorization')) {
        return res.status(400).json({ error_message: "Authentication required for this search" })
    }

    let user_id = null
    if (req.get('X-Authorization')) {
        core.getUserIdFromToken(req.get('X-Authorization'), (err, row) => {
            if (err) return res.status(500).json({ error_message: "Server error" })
            if (!row) return res.status(401).json({ error_message: "Invalid session" })

            user_id = row.user_id
            core.searchItems(limit, offset, status, query, user_id, (err2, rows) => {
                if (err2) return res.status(500).json({ error_message: "Server error" })
                return res.status(200).json(rows || [])
            })
        })
    } else {
        core.searchItems(limit, offset, status, query, 0, (err, rows) => {
            if (err) return res.status(500).json({ error_message: "Server error" })
            return res.status(200).json(rows || [])
        })
    }
}

module.exports = {
    new_item,
    get_item,
    bid_item,
    bid_history,
    search
}