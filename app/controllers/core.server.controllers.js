const core = require("../models/core.server.models")
const Joi = require("joi")

// auction manangement

const new_item = (req, res) => {
    const session_token = req.get('X-Authorization');
    if (!session_token) return res.status(401).json({ error_message: "No session token available" })

    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        starting_bid: Joi.number().required(),
        end_date: Joi.number().required()
    })

    const { error, value } = schema.validate(req.body)
    if(error) return res.status(400).json({error_message: error.details[0].message});

    core.getUserIdFromToken(session_token, (err, row) => {
        if (err) return res.status(500).json({ error_message: "Server error" })
        if (!row) return res.status(401).json({ error_message: "Invalid session" })

        core.addItem(value.name, value.description, value.starting_bid, value.end_date, row.user_id, (err2, item_id) => {
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
            creator: {
                first_name: row.creator_first_name,
                last_name: row.creator_last_name
            },
            current_bid: row.current_bid || null,
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
        
        core.bidOnItem(id, row.user_id, value.amount, (err2) => {
            if (err2) return res.status(400).json({ error_message: err2.message })
            return res.status(201).json({ message: "Bid successfully created" })
        })
    })
}

const bid_history = (req, res) => {
    let id = parseInt(req.params.item_id)
    if(isNaN(id) || id <= 0) return res.status(400).json({ error_message: 'Invalid item id'})

    core.getAllBidsForItem(id, (err, rows) => {
        if (err) return res.status(500).json({ error_message: "Server error" })
        if (!rows || rows.length === 0) return res.status(404).json({ error_message: "No bids found" })
        return res.status(200).json(rows)
    })
}

module.exports = {
    new_item,
    get_item,
    bid_item,
    bid_history
}