const question = require("../models/question.server.models")
const core = require("../models/core.server.models")
const Joi = require("joi")
const { RegExpMatcher, englishDataset, englishRecommendedTransformers } = require('obscenity')

const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers
});


// question management

const get_questions = (req, res) => {
    let item_id = parseInt(req.params.item_id);
    if(isNaN(item_id) || item_id <= 0) return res.status(400).json({ error_message: 'Invalid item id'})

    // First check if item exists
    const core = require("../models/core.server.models")
    core.itemExists(item_id, (err, item) => {
        if(err) return res.status(500).json({ error_message: 'Server error' });
        if(!item) return res.status(404).json({ error_message: 'Item not found' });

        question.getQuestions(item_id, (err2, row) => {
            if(err2) return res.status(500).json({ error_message: 'Server error' });
            if(!row || row.length === 0) return res.status(200).json([]);
            return res.status(200).json(row);
        })
    })
}

const ask_question = (req, res) => {
    let id = parseInt(req.params.item_id);
    if(isNaN(id) || id <= 0) return res.status(404).json({ error_message: 'Invalid item id'})
    
    const session_token = req.get('X-Authorization');
    if(!session_token) return res.status(401).json({error_message: "No session token"});

    const schema = Joi.object({
        question_text: Joi.string().required()
    })

    const { error, value } = schema.validate(req.body)
    if(error) return res.status(400).json({error_message: error.details[0].message});

    if (matcher.hasMatch(value.question_text)) {
        return res.status(400).json({ error_message: "Input contains profanity" })
    }
    
    user.getUserIdFromToken(session_token, (err, row) => {
        if (err) {
            console.error("Token lookup error:", err);
            return res.status(500).json({ error_message: "Server error" })
        }
        if (!row) {
            console.error("No user found for token:", session_token);
            return res.status(401).json({ error_message: "Unauthorized" })
        }

        const current_user_id = parseInt(row.user_id)

        core.getItemFromId(id, (err, row) => {
            if (err) return res.status(500).json({ error_message: 'Server error' });
            if (!row) return res.status(404).json({ error_message: 'Item not found' });

            if(current_user_id === parseInt(row.creator_id)) {
                return res.status(403).json({ error_message: "You cannot ask a question on your own item"})
            }

            question.addQuestion(value.question_text, current_user_id, id, (err) => {
                if (err) return res.status(500).json({ error_message: "Server error" })
                return res.status(200).json({ message: "Question added successfully" })
            })  

        })
    });
}

const answer_question = (req, res) => {
    let id = parseInt(req.params.question_id);
    if(isNaN(id) || id <= 0) return res.status(404).json({ error_message: 'Invalid question id'})
    
    const session_token = req.get('X-Authorization');
    if(!session_token) return res.status(401).json({error_message: "No session token"});

    const schema = Joi.object({
        answer_text: Joi.string().required()
    })

    const { error, value } = schema.validate(req.body)
    if(error) return res.status(400).json({error_message: error.details[0].message});

    if (matcher.hasMatch(value.question_text)) {
        return res.status(400).json({ error_message: "Input contains profanity" })
    }

    user.getUserIdFromToken(session_token, (err, row) => {
        if (err) {
            console.error("Token lookup error:", err);
            return res.status(500).json({ error_message: "Server error" })
        }
        if (!row) {
            console.error("No user found for token:", session_token);
            return res.status(401).json({ error_message: "Unauthorized" })
        }

        const current_user_id = parseInt(row.user_id)

        core.getItemFromId(id, (err, row) => {
            if (err) return res.status(500).json({ error_message: 'Server error' });
            if (!row) return res.status(404).json({ error_message: 'Item not found' });

            if(current_user_id != parseInt(row.creator_id)) {
                return res.status(403).json({ error_message: "Only the seller can answer questions on their items"})
            }

            question.answerQuestion(id, value.answer_text, (err) => {
                if (err) return res.status(500).json({ error_message: "Server error" })
                return res.status(200).json({ message: "Question answered added successfully" })
            })  

        })
    });
}

module.exports = {
    get_questions,
    ask_question,
    answer_question
}