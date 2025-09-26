const express = require("express");
const { apiValidator } = require("../auth/apiKey");
const { cronController } = require("../controller/cronController");
const router = express.Router();
router.get("/mint", apiValidator, cronController);
module.exports = router;
