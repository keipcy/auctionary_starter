const db = require("../../database")

const getQuestions = (item_id, done) => {
    const sql = "SELECT question_id, question, answer FROM questions WHERE item_id = ?"

    db.get(sql, [item_id], (err, row) => {
        return done(err, row)
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