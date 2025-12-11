const question = require("../controllers/question.server.controllers")

module.exports = function(app) {
    // question management
    app.route("/item/:item_id/question")
        .get(question.get_questions);
    app.route("/item/:item_id/question")
        .post(question.ask_question);
    app.route("/question/:question_id")
        .post(question.answer_question);
    }
