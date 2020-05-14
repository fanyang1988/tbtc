const states = require("./states/deposit.js")
const {deployAndLinkAll} = require("./helpers/fullDeployer.js")
const {runStatePath} = require("./states/run.js")

describe("tBTC states", () => {
  runStatePath(
    states,
    deployAndLinkAll(),
    "start",
    "awaitingSignerSetup",
    "awaitingFundingProof",
    "active",
  )
})