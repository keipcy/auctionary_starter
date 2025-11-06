const users = require("../controllers/user.server.controllers")

module.exports = function(app) {
    // user management
    app.route("/users")
        .post(users.create_account);
    app.route("/login")
        .post(users.login);
    app.route("/logout")
        .post(users.logout);
    // auction management
    app.route("/item")
        .post(new_item);
    app.route("/item/:item_id/bid")
        .post();
    app.route("/item/:item_id")
        .get();
    app.route("/item/:item_id/bid")
        .get();
    // question management
    app.route("/item/:item_id/question")
        .get();
    app.route("/item/:item_id/question")
        .post();
    app.route("/question/:question_id")
        .post();
    }
