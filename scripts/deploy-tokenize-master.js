/**
 * @dev Interactive script to deploy a Master contract of Tokenization Protocol
 */

const Master = artifacts.require("Master");

module.exports = async (callback) => {
  try {
    console.log(`Deploying Tokenization Master Contract...`);
    let MasterC = await Master.new();

    console.log(`\nTokenization Master deployed at: ${MasterC.address}\n`);
    callback();
  } catch (err) {
    callback(err);
  }
};
