
const BigNumber = require('bignumber.js');
const {
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const {
  tokenToDecimal,
  decimalToToken,
  tokenToDecimalBN,
  decimalToTokenBN
} = require('./utils/token-helper');

//  For decimal truncation like solidity
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN })

const Pool = artifacts.require('PoolToken');
const RTokenMock = artifacts.require('RTokenMock');


let PoolC, RTokenMockC, accounts;
let users = {};

const onePoolTokenValue = async () => {
  let poolErcBal = (await RTokenMockC.balanceOf(PoolC.address)).add(await RTokenMockC.interestPayableOf(PoolC.address));
  let poolTokenCirculation = (await PoolC.totalSupply()).sub(await PoolC.balanceOf(users.superAdmin));
  return parseFloat(poolErcBal) / parseFloat(poolTokenCirculation);
}

const onePoolTokenValueBN = async () => {
  let poolErcBal = (await RTokenMockC.balanceOf(PoolC.address)).add(await RTokenMockC.interestPayableOf(PoolC.address));
  let poolTokenCirculation = (await PoolC.totalSupply()).sub(await PoolC.balanceOf(users.superAdmin));
  return BigNumber(poolErcBal).div(BigNumber(poolTokenCirculation));
}

before('Deploy Erc20 and Pool contract', async () => {

  RTokenMockC = await RTokenMock.new('Test Token', 'TST', 18);
  let decimals = await RTokenMockC.decimals();
  let initialSupply = tokenToDecimal(100, decimals);
  initialSupply = web3.utils.toHex(initialSupply);
  PoolC = await Pool.new(RTokenMockC.address, 'Pool Token', 'POOL', decimals, initialSupply);
});

it('Get accounts', async () => {
  accounts = await web3.eth.getAccounts();
  users.superAdmin = accounts[0];
  users.randomUser = accounts[1];
  users.redeemer1 = accounts[2];
  users.redeemer2 = accounts[3];
});
describe('Pool Deployment Test', () => {
  it('check name, symbol, decimal', async() => {
    assert.equal(await PoolC.name(), 'Pool Token', 'token name');
    assert.equal(await PoolC.symbol(), 'POOL', 'token symbol');
    assert.equal(parseInt(await PoolC.decimals()), parseInt(await RTokenMockC.decimals()), 'token decimals');
  })
  it('initial supply minted to pool deployer', async() => {
    let initialSupply = tokenToDecimal(100, await RTokenMockC.decimals());
    initialSupply = web3.utils.toHex(initialSupply);
    assert.equal(web3.utils.toHex(await PoolC.totalSupply()), initialSupply, 'initialSupply');
    assert.equal(web3.utils.toHex(await PoolC.balanceOf(users.superAdmin)), initialSupply, 'balance of deployer');
  })
  it('check owner of Pool', async() => {
    assert.equal(await PoolC.owner(), users.superAdmin, 'owner');
  })
  it('check erc20 token balance of pool', async() => {
    assert.equal(await RTokenMockC.balanceOf(PoolC.address), 0, 'zero balance');
  })
});
describe('Mint Pool Tokens', () => {
  it('non deployer cannot mint pool tokens', async() => {
    let amount = tokenToDecimal(100, await PoolC.decimals());
    amount = web3.utils.toHex(amount);
    
    await expectRevert(PoolC.mintPoolTokens(amount, {
      from: users.randomUser,
    }), 'Ownable: caller is not the owner');
  }) 
  it('owner can mint pool tokens', async() => {
    let amount = tokenToDecimal(900, await PoolC.decimals());
    amount = new BigNumber(amount);
    let initialSupply = await PoolC.totalSupply();
    initialSupply = new BigNumber(initialSupply);

    let mintTx = await PoolC.mintPoolTokens(amount, {
      from: users.superAdmin,
    });
    let finalSupply = new BigNumber(await PoolC.totalSupply());
    let expectedSupply = initialSupply.plus(amount);

    assert.ok(finalSupply.isEqualTo(expectedSupply), 'total supply')
    assert.equal(mintTx.logs.length, 1, 'Not 1 event');
    assert.equal(mintTx.logs[0].event, 'Transfer', 'transfer event');
  })
});
describe('Redeem Cases', () => {
  before('Set interest of rToken and reduce pool tokens', async () => {
    await RTokenMockC.setInterestAmount(tokenToDecimalBN(100, await RTokenMockC.decimals()));
    await PoolC.transfer(users.redeemer1, tokenToDecimalBN(100, await RTokenMockC.decimals()));
  });
  it('check erc20 balance of pool, both real time and non real time', async() => {
    let bal = await RTokenMockC.balanceOf(PoolC.address);
    bal = new BigNumber(bal);
    let expectedVal = tokenToDecimalBN(0, await RTokenMockC.decimals());
    assert.ok(bal.eq(expectedVal), 'erc20 balance');
    let realTimebal = bal.plus(await RTokenMockC.interestPayableOf(PoolC.address))
    assert.ok(realTimebal.eq(tokenToDecimalBN(100, await RTokenMockC.decimals())), 'erc20 balance');
  });
  it('check pool token balance of admin and redeemer', async() => {
    let balAdmin = await PoolC.balanceOf(users.superAdmin);
    balAdmin = new BigNumber(balAdmin);
    let expectedVal = tokenToDecimalBN(900, await RTokenMockC.decimals());
    assert.ok(balAdmin.eq(expectedVal), 'pool token balance of admin');

    let balRedeemer = await PoolC.balanceOf(users.redeemer1);
    balRedeemer = new BigNumber(balRedeemer);
    let expectedVal2 = tokenToDecimalBN(100, await RTokenMockC.decimals());
    assert.ok(balRedeemer.eq(expectedVal2), 'pool token balance of redeemer1');
  });
  it('redeem 10 pool tokens', async() => {
    let initialErcBalRedeemer1 = await RTokenMockC.balanceOf(users.redeemer1);
    initialErcBalRedeemer1 = new BigNumber(initialErcBalRedeemer1);
    let initialErcBalPool = await RTokenMockC.balanceOf(PoolC.address);
    initialErcBalPool = new BigNumber(initialErcBalPool);
    initialErcBalPool = initialErcBalPool.plus(await RTokenMockC.interestPayableOf(PoolC.address));
    let initialPoolSupply = new BigNumber(await PoolC.totalSupply());
    let initialPoolCirculation = (initialPoolSupply.minus(await PoolC.balanceOf(users.superAdmin)));

    let redeemAmount = tokenToDecimalBN(10, await PoolC.decimals());
    let redeemTx = await PoolC.redeem(redeemAmount, {
      from: users.redeemer1,
    });
    let expectedBal = initialErcBalRedeemer1.plus(redeemAmount);
    assert.ok(BigNumber(await RTokenMockC.balanceOf(users.redeemer1)).eq(expectedBal), 'redeemed balance');
    assert.ok(BigNumber(await RTokenMockC.balanceOf(PoolC.address)).eq(initialErcBalPool.minus(redeemAmount)), 'redeemed balance');
    assert.ok(BigNumber(await PoolC.totalSupply()).eq(initialPoolSupply.minus(redeemAmount)), 'total supply');
    assert.ok(BigNumber(await PoolC.totalSupply()).minus(await PoolC.balanceOf(users.superAdmin)).eq(initialPoolCirculation.minus(redeemAmount)), 'total circulation');
    
    // ISSUE - unable to get correct logs in redeemTx.logs
    assert.equal(redeemTx.receipt.rawLogs.length, 5, 'Not 5 event');
    // assert.equal(redeemTx.logs[0].event, 'Transfer', 'transfer event');
    // assert.equal(redeemTx.logs[1].event, 'Transfer', 'transfer event');
    // assert.equal(redeemTx.logs[2].event, 'Redeem', 'transfer event');
  });
  it('Mint 500 erc20 and redeem 10 pool tokens', async() => {
    await RTokenMockC.setInterestAmount(tokenToDecimalBN(500, await RTokenMockC.decimals()));
    assert.ok(BigNumber(await RTokenMockC.balanceOf(PoolC.address)).plus(await RTokenMockC.interestPayableOf(PoolC.address))
      .eq(tokenToDecimalBN(590, await RTokenMockC.decimals())), 'erc20 balance of pool is not 590 ');
    assert.ok(BigNumber(await PoolC.totalSupply()).minus(await PoolC.balanceOf(users.superAdmin))
      .eq(tokenToDecimalBN(90, await PoolC.decimals())), 'total circulation is not 90');

    let initialErcBalRedeemer1 = new BigNumber(await RTokenMockC.balanceOf(users.redeemer1));
    assert.ok(initialErcBalRedeemer1.eq(tokenToDecimalBN(10, await RTokenMockC.decimals())), 'redeemer bal is not 10');

    let redeemAmount = tokenToDecimalBN(10, await PoolC.decimals());
    
    let expectedReturn = parseFloat(redeemAmount) * await onePoolTokenValue();
    expectedReturn = decimalToToken(expectedReturn, await RTokenMockC.decimals());
    let expectedFinal = decimalToToken(parseFloat(initialErcBalRedeemer1), await RTokenMockC.decimals()) + expectedReturn;
    let redeemTx = await PoolC.redeem(redeemAmount, {
      from: users.redeemer1,
    });
    let finalBal = await RTokenMockC.balanceOf(users.redeemer1);
    finalBal = decimalToToken(parseFloat(finalBal), await RTokenMockC.decimals());
    assert.equal(finalBal, expectedFinal, 'redeemed balance');

    assert.ok(BigNumber(await PoolC.totalSupply()).minus(await PoolC.balanceOf(users.superAdmin))
      .eq(tokenToDecimalBN(80, await PoolC.decimals())), 'total circulation is not 80');
  });
  it('Mint 5000 erc20 and circulate 200 pool token then redeem 10 pool tokens', async() => {
    let decimals = await PoolC.decimals();

    await RTokenMockC.setInterestAmount(tokenToDecimalBN(5000, await RTokenMockC.decimals()));
    let interestAmount = BigNumber(await RTokenMockC.interestPayableOf(PoolC.address));
    let initialErcBalPool = BigNumber(await RTokenMockC.balanceOf(PoolC.address)).plus(interestAmount);
    
    assert.equal(decimalToTokenBN(initialErcBalPool, decimals).toFixed(2), 5524.44, 'redeemed balance');

    await PoolC.mintPoolTokens(tokenToDecimalBN(200, await RTokenMockC.decimals()), {
      from: users.superAdmin,
    });
    await PoolC.transfer(users.redeemer2, tokenToDecimalBN(200, await RTokenMockC.decimals()), {
      from: users.superAdmin
    });

    let realCirculationSupply = (await PoolC.totalSupply()).sub(await PoolC.balanceOf(users.superAdmin));
    realCirculationSupply = BigNumber(realCirculationSupply)
    assert.ok(realCirculationSupply.eq(tokenToDecimalBN(280, await PoolC.decimals())), 'total circulation is not 280');

    let initialErcBalRedeemer2 = new BigNumber(await RTokenMockC.balanceOf(users.redeemer2));
    assert.ok(initialErcBalRedeemer2.eq(tokenToDecimalBN(0, await RTokenMockC.decimals())), 'redeemer bal is not 0');

    let redeemAmount = tokenToDecimalBN(20, await PoolC.decimals());
    let expectedReturn = redeemAmount.times(await onePoolTokenValueBN());
    let expectedFinal = initialErcBalRedeemer2.plus(expectedReturn);
    await PoolC.redeem(redeemAmount, {
      from: users.redeemer2,
    });
    let finalBal = BigNumber(await RTokenMockC.balanceOf(users.redeemer2));
    assert.deepEqual(finalBal.toFixed(0), expectedFinal.toFixed(0), 'redeemed balance');

    assert.equal(decimalToTokenBN(finalBal, decimals).toFixed(2), 394.60, 'redeemed balance');

    let finalCirculation = (await PoolC.totalSupply()).sub(await PoolC.balanceOf(users.superAdmin));
    finalCirculation = BigNumber(finalCirculation);

    assert.ok(finalCirculation.eq(tokenToDecimalBN(260, await PoolC.decimals())), 'total circulation is not 260');
  });
});
