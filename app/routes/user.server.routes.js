const users = require("../controllers/user.server.controllers")

module.exports = function(app) {
    // user management
    app.route("/users")
        .post(users.create_account);
    app.route("/login")
        .post(users.login);
    app.route("/logout")
        .post(users.logout);
    app.route("/users/:user_id")
        .get(users.get_user);
    }
