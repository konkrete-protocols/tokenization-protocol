
const {
  tokenToDecimal,
  decimalToToken,
  tokenToDecimalBN,
  decimalToTokenBN
} = require('./utils/token-helper');

const {
  BN,           // Big Number support 
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const Pool = artifacts.require('ClaimPool');
const MockErc20 = artifacts.require('TestERC20');


let PoolC, MockErc20C, accounts;
let users = {};
const nullAddress = '0x0000000000000000000000000000000000000000';

const onePoolTokenValue = async () => {
  let poolErcBal = await MockErc20C.balanceOf(PoolC.address);
  let poolTokenCirculation = (await PoolC.totalSupply()).sub(await PoolC.balanceOf(users.superAdmin));
  return parseFloat(poolErcBal) / parseFloat(poolTokenCirculation);
}

before('Deploy Erc20 and Pool contract', async () => {

  MockErc20C = await MockErc20.new('Test Token', 'TST', 18);
  let decimals = await MockErc20C.decimals();
  let initialSupply = tokenToDecimal(100, decimals);
  initialSupply = web3.utils.toHex(initialSupply);
  PoolC = await Pool.new(MockErc20C.address, 'Pool Token', 'POOL', decimals, initialSupply);
});

it('Get accounts', async () => {
  accounts = await web3.eth.getAccounts();
  users.superAdmin = accounts[0];
  users.randomUser = accounts[1];
});
describe('Pool Deployment Test', () => {
  it('check name, symbol, decimal', async() => {
    assert.equal(await PoolC.name(), 'Pool Token', 'token name');
    assert.equal(await PoolC.symbol(), 'POOL', 'token symbol');
    assert.equal(parseInt(await PoolC.decimals()), parseInt(await MockErc20C.decimals()), 'token decimals');
  })
  it('initial supply minted to pool deployer', async() => {
    let initialSupply = tokenToDecimal(100, await MockErc20C.decimals());
    initialSupply = web3.utils.toHex(initialSupply);
    assert.equal(web3.utils.toHex(await PoolC.totalSupply()), initialSupply, 'initialSupply');
    assert.equal(web3.utils.toHex(await PoolC.balanceOf(users.superAdmin)), initialSupply, 'balance of deployer');
  })
  it('check owner of Pool', async() => {
    assert.equal(await PoolC.owner(), users.superAdmin, 'owner');
  })
  it('check erc20 token balance of pool', async() => {
    assert.equal(await MockErc20C.balanceOf(PoolC.address), 0, 'zero balance');
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
    amount = new BN(amount.toString());
    let initialSupply = await PoolC.totalSupply();

    let mintTx = await PoolC.mintPoolTokens(amount, {
      from: users.superAdmin,
    });
    let finalSupply = await PoolC.totalSupply();
    let expectedSupply = initialSupply.add(amount);
    assert.equal(parseInt(finalSupply), parseInt(expectedSupply), 'total supply');
    assert.equal(mintTx.logs.length, 1, 'Not 1 event');
    assert.equal(mintTx.logs[0].event, 'Transfer', 'transfer event');
    // expect(amount.add(initialSupply)).to.be.eql(finalSupply)
  })
});
describe('Redeem Cases', () => {
  before('Give erc20 balance to pool and reduce pool tokens', async () => {
    users.redeemer1 = accounts[2];
    await MockErc20C.mint(PoolC.address, tokenToDecimalBN(100, await MockErc20C.decimals()));
    await PoolC.transfer(users.redeemer1, tokenToDecimalBN(100, await MockErc20C.decimals()));
  });
  it('check erc20 balance of pool', async() => {
    let bal = await MockErc20C.balanceOf(PoolC.address);
    bal = new BN(bal);
    let expectedVal = tokenToDecimalBN(100, await MockErc20C.decimals());
    assert.ok(bal.eq(expectedVal), 'erc20 balance');
  });
  it('check pool token balance of admin and redeemer', async() => {
    let balAdmin = await PoolC.balanceOf(users.superAdmin);
    balAdmin = new BN(balAdmin);
    let expectedVal = tokenToDecimalBN(900, await MockErc20C.decimals());
    assert.ok(balAdmin.eq(expectedVal), 'pool token balance of admin');

    let balRedeemer = await PoolC.balanceOf(users.redeemer1);
    balRedeemer = new BN(balRedeemer);
    let expectedVal2 = tokenToDecimalBN(100, await MockErc20C.decimals());
    assert.ok(balRedeemer.eq(expectedVal2), 'pool token balance of redeemer1');
  });
  it('redeem 10 pool tokens', async() => {
    let initialErcBalRedeemer1 = await MockErc20C.balanceOf(users.redeemer1);
    initialErcBalRedeemer1 = new BN(initialErcBalRedeemer1);
    let initialErcBalPool = await MockErc20C.balanceOf(PoolC.address);
    initialErcBalPool = new BN(initialErcBalPool);
    let initialPoolSupply = new BN(await PoolC.totalSupply());
    let initialPoolCirculation = (initialPoolSupply.sub(await PoolC.balanceOf(users.superAdmin)));

    let redeemAmount = tokenToDecimalBN(10, await PoolC.decimals());
    let redeemTx = await PoolC.redeem(redeemAmount, {
      from: users.redeemer1,
    });
    let expectedBal = initialErcBalRedeemer1.add(redeemAmount);
    assert.ok((await MockErc20C.balanceOf(users.redeemer1)).eq(expectedBal), 'redeemed balance');
    assert.ok((await MockErc20C.balanceOf(PoolC.address)).eq(initialErcBalPool.sub(redeemAmount)), 'redeemed balance');
    assert.ok((await PoolC.totalSupply()).eq(initialPoolSupply.sub(redeemAmount)), 'total supply');
    assert.ok((await PoolC.totalSupply()).sub(await PoolC.balanceOf(users.superAdmin)).eq(initialPoolCirculation.sub(redeemAmount)), 'total circulation');
    assert.equal(redeemTx.logs.length, 3, 'Not 3 event');
    assert.equal(redeemTx.logs[0].event, 'Transfer', 'transfer event');
    assert.equal(redeemTx.logs[1].event, 'Transfer', 'transfer event');
    assert.equal(redeemTx.logs[2].event, 'Redeem', 'transfer event');
  });
  it('Mint 500 erc20 and redeem 10 pool tokens', async() => {
    await MockErc20C.mint(PoolC.address, tokenToDecimalBN(500, await MockErc20C.decimals()));
    assert.ok((await MockErc20C.balanceOf(PoolC.address))
      .eq(tokenToDecimalBN(590, await MockErc20C.decimals())), 'erc20 balance of pool is not 590 ');
    assert.ok((await PoolC.totalSupply()).sub(await PoolC.balanceOf(users.superAdmin))
      .eq(tokenToDecimalBN(90, await PoolC.decimals())), 'total circulation is not 90');

    let initialErcBalRedeemer1 = new BN(await MockErc20C.balanceOf(users.redeemer1));
    assert.ok(initialErcBalRedeemer1.eq(tokenToDecimalBN(10, await MockErc20C.decimals())), 'redeemer bal is not 10');

    let redeemAmount = tokenToDecimalBN(10, await PoolC.decimals());
    
    let expectedReturn = parseFloat(redeemAmount) * await onePoolTokenValue();
    expectedReturn = decimalToToken(expectedReturn, await MockErc20C.decimals());
    let expectedFinal = decimalToToken(parseFloat(initialErcBalRedeemer1), await MockErc20C.decimals()) + expectedReturn;
    let redeemTx = await PoolC.redeem(redeemAmount, {
      from: users.redeemer1,
    });
    let finalBal = await MockErc20C.balanceOf(users.redeemer1);
    finalBal = decimalToToken(parseFloat(finalBal), await MockErc20C.decimals());
    assert.equal(finalBal, expectedFinal, 'redeemed balance');

    assert.ok((await PoolC.totalSupply()).sub(await PoolC.balanceOf(users.superAdmin))
      .eq(tokenToDecimalBN(80, await PoolC.decimals())), 'total circulation is not 80');
  });
});
