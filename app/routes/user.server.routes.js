const users = require("../controllers/user.server.controllers")

module.exports = function(app) {
    // user management
    app.route("/users")
        .post(users.create_account);
    app.route("/login")
        .post(users.login);
    app.route("/logout")
        .post(users.logout);
    // question management
    // app.route("/item/:item_id/question")
    //     .get();
    // app.route("/item/:item_id/question")
    //     .post();
    // app.route("/question/:question_id")
    //     .post();
    }
