/**
 * @dev Interactive script to deploy a Pool Token contract
 */

const { promisify } = require("util");
const BigNumber = require('bignumber.js');
const rl = require("./common/rl");
const PoolToken = artifacts.require("PoolToken");

module.exports = async (callback) => {
  try {

    let name = await promisify(rl.question)("Provide PoolToken Name/Description: ");
    let symbol = await promisify(rl.question)("Provide PoolToken Symbol: ");
    let decimals = await promisify(rl.question)("Provide PoolToken Decimals (Should be equal to Rtoken decimals): ");
    let rTokenAddress = await promisify(rl.question)("Provide rToken Address: ");
    let initialSupply = await promisify(rl.question)("Provide initial Pool Token supply: ");
    
    if (!name || !symbol || !decimals || !rTokenAddress || !initialSupply) {
        console.log("Invalid Input!!! Returning");
        callback();
    }

    let iniSuppDecimals = BigNumber(initialSupply * Math.pow(10, decimals));
    // iniSuppDecimals = web3.utils.toBN(iniSuppDecimals);

    let PoolC = await PoolToken.new(rTokenAddress, name, symbol, decimals, iniSuppDecimals);

    console.log("\n");
    console.log(`${symbol} deployed at: ${PoolC.address}\n`);
    callback();
  } catch (err) {
    callback(err);
  }
};
