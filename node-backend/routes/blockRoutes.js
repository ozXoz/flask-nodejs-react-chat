const express = require("express");
const router = express.Router();
const blockControllerFactory = require("../controllers/blockController");

// In server.js we'll do `const blockController = blockControllerFactory(io);`

module.exports = (io) => {
  const blockController = blockControllerFactory(io);

  router.post("/", blockController.blockUser);
  router.post("/unblock", blockController.unblockUser);
  router.get("/is-blocked", blockController.isBlocked);

  return router;
};
