const db = require("../../database")

const getQuestions = (item_id, done) => {
    const sql = "SELECT question_id, question AS question_text, answer AS answer_text FROM questions WHERE item_id = ? ORDER BY question_id DESC"

    db.all(sql, [item_id], (err, rows) => {
        return done(err, rows)
    })
}

const addQuestion = (question, asked_by, item_id, done) => {
    const sql = "INSERT INTO questions (question, asked_by, item_id) VALUES (?, ?, ?)"
    const values = [question, asked_by, item_id]

    db.run(sql, values, function(err) {
        return done(err)
    })
}

const answerQuestion = (question_id, answer, done) => {
    const sql = "UPDATE questions SET answer = ? WHERE question_id = ?"
    const values = [answer, question_id]

    db.run(sql, values, function(err) {
        return done(err)
    })
}

module.exports = {
    getQuestions,
    addQuestion,
    answerQuestion
}