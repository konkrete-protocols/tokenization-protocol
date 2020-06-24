/**
 * @dev Interactive script to deploy a Pool Token contract
 */

const { promisify } = require("util");
const BigNumber = require('bignumber.js');
const rl = require("./common/rl");
const defaults = require("./common/defaults");
const PoolToken = artifacts.require("PoolToken");
const ERC20Detailed = artifacts.require("ERC20Detailed");

module.exports = async (callback) => {
  try {

    const network = process.argv[4];

    let name = await promisify(rl.question)("Provide PoolToken Name/Description: ") || defaults.ptName;
    let symbol = await promisify(rl.question)("Provide PoolToken Symbol: ") || defaults.ptSymbol;
    let rTokenAddress = await promisify(rl.question)("Provide rToken Address: ") || defaults[network].rTokenAddress;
    let initialSupply = await promisify(rl.question)("Provide initial Pool Token supply: ") || defaults.ptSupply;

    const erc = await ERC20Detailed.at(rTokenAddress);
    let decimals = await erc.decimals();
    
    if (!name || !symbol || !decimals || !rTokenAddress || !initialSupply) {
        console.log("Invalid Input!!! Returning");
        callback();
    }

    let iniSuppDecimals = BigNumber(initialSupply * Math.pow(10, decimals));

    let PoolC = await PoolToken.new(rTokenAddress, name, symbol, decimals, iniSuppDecimals);

    console.log("\n");
    console.log(`${symbol} deployed at: ${PoolC.address}\n`);
    callback();
  } catch (err) {
    callback(err);
  }
};
