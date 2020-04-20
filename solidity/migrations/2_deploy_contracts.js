// bitcoin-spv
const BytesLib = artifacts.require("BytesLib")
const BTCUtils = artifacts.require("BTCUtils")
const ValidateSPV = artifacts.require("ValidateSPV")
const CheckBitcoinSigs = artifacts.require("CheckBitcoinSigs")

// logging
const OutsourceDepositLogging = artifacts.require("OutsourceDepositLogging")
const DepositLog = artifacts.require("DepositLog")

// deposit
const DepositStates = artifacts.require("DepositStates")
const DepositUtils = artifacts.require("DepositUtils")
const DepositFunding = artifacts.require("DepositFunding")
const DepositRedemption = artifacts.require("DepositRedemption")
const DepositLiquidation = artifacts.require("DepositLiquidation")
const Deposit = artifacts.require("Deposit")
const VendingMachine = artifacts.require("VendingMachine")

// price feed
const MockSatWeiPriceFeed = artifacts.require("ETHBTCPriceFeedMock")
const prices = require("./prices")

const MockRelay = artifacts.require("MockRelay")

// system
const TBTCConstants = artifacts.require("TBTCConstants")
const TBTCDevelopmentConstants = artifacts.require("TBTCDevelopmentConstants")
const TBTCSystem = artifacts.require("TBTCSystem")

// tokens
const TBTCToken = artifacts.require("TBTCToken")
const TBTCDepositToken = artifacts.require("TBTCDepositToken")
const FeeRebateToken = artifacts.require("FeeRebateToken")

// deposit factory
const DepositFactory = artifacts.require("DepositFactory")

const all = [
  BytesLib,
  BTCUtils,
  ValidateSPV,
  TBTCConstants,
  CheckBitcoinSigs,
  OutsourceDepositLogging,
  DepositLog,
  DepositStates,
  DepositUtils,
  DepositFunding,
  DepositRedemption,
  DepositLiquidation,
  Deposit,
  TBTCSystem,
  SatWeiPriceFeed,
  VendingMachine,
  FeeRebateToken,
]

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    if (network == "keep_dev" || network == "development") {
      // For keep_dev and local, replace constants with testnet constants.
      all[all.indexOf(TBTCConstants)] = TBTCDevelopmentConstants
    }

    // bitcoin-spv
    await deployer.deploy(BytesLib)
    await deployer.link(BytesLib, all)

    await deployer.deploy(BTCUtils)
    await deployer.link(BTCUtils, all)

    await deployer.deploy(ValidateSPV)
    await deployer.link(ValidateSPV, all)

    await deployer.deploy(CheckBitcoinSigs)
    await deployer.link(CheckBitcoinSigs, all)

    // constants
    await deployer.deploy(TBTCConstants)
    await deployer.link(TBTCConstants, all)

    // logging
    await deployer.deploy(OutsourceDepositLogging)
    await deployer.link(OutsourceDepositLogging, all)

    let difficultyRelay
    // price feeds
    if (network !== "mainnet") {
      // On mainnet, we use the MakerDAO-deployed price feed.
      // See: https://github.com/makerdao/oracles-v2#live-mainnet-oracles
      // Otherwise, we deploy our own mock price feeds, which are simpler
      // to maintain.
      await deployer.deploy(MockSatWeiPriceFeed)
      const satWeiPriceFeed = await MockSatWeiPriceFeed.deployed()
      await satWeiPriceFeed.setValue(prices.satwei)

      // On mainnet, we use the Summa-provided relay; see
      // https://github.com/summa-tx/relays . On testnet, we use a local mock.
      await deployer.deploy(MockRelay)
      difficultyRelay = await MockRelay.deployed()
    }

    // TODO This should be dropped soon.
    await deployer.deploy(SatWeiPriceFeed)

    if (!difficultyRelay) {
      throw new Error("Difficulty relay not found.")
    }

    // system
    await deployer.deploy(
      TBTCSystem,
      SatWeiPriceFeed.address,
      difficultyRelay.address,
    )

    await deployer.deploy(DepositFactory, TBTCSystem.address)

    await deployer.deploy(VendingMachine, TBTCSystem.address)

    // deposit
    await deployer.deploy(DepositStates)
    await deployer.link(DepositStates, all)

    await deployer.deploy(DepositUtils)
    await deployer.link(DepositUtils, all)

    await deployer.deploy(DepositLiquidation)
    await deployer.link(DepositLiquidation, all)

    await deployer.deploy(DepositRedemption)
    await deployer.link(DepositRedemption, all)

    await deployer.deploy(DepositFunding)
    await deployer.link(DepositFunding, all)

    await deployer.deploy(Deposit)

    // token
    await deployer.deploy(TBTCToken, VendingMachine.address)
    await deployer.deploy(TBTCDepositToken, DepositFactory.address)
    await deployer.deploy(FeeRebateToken, VendingMachine.address)
  })
}
