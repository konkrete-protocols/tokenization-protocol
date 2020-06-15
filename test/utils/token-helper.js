
const { BN } = require('@openzeppelin/test-helpers');

const tokenToDecimal = (amount, decimals) => {
  decimals = parseFloat(decimals);
  amount = parseFloat(amount);
  return amount * Math.pow(10, decimals);
}

const decimalToToken = (amount, decimals) => {
  decimals = parseFloat(decimals);
  amount = parseFloat(amount);
  return amount / Math.pow(10, decimals);
}

const tokenToDecimalBN = (amount, decimals) => {
  amount = new BN(amount);
  decimals = new BN(decimals);
  let ten = new BN(10);
  return amount.mul(ten.pow(decimals));  
}

const decimalToTokenBN = (amount, decimals) => {
  amount = new BN(amount);
  decimals = new BN(decimals);
  let ten = new BN(10);
  return amount.div(ten.pow(decimals));
}

module.exports = {
  tokenToDecimal,
  decimalToToken,
  tokenToDecimalBN,
  decimalToTokenBN
};
