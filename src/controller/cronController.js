const { delegator } = require("../service/delegate");
const { logicPower } = require("../service/delegateLogicPower");

async function cronController(req, res, next) {
  await delegator();
  await logicPower();
}
module.exports = { cronController };
