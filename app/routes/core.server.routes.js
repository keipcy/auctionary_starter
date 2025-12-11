const core = require("../controllers/core.server.controllers")

module.exports = function(app) {
    // auction management
    app.route("/search")
        .get(core.search);
    app.route("/item")
        .post(core.new_item);
    app.route("/item/:item_id/bid")
        .get(core.bid_history)
        .post(core.bid_item);
    app.route("/item/:item_id")
        .get(core.get_item);
    }
