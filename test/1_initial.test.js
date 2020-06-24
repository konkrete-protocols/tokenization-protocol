const Master = artifacts.require('Master');
const ERC20 = artifacts.require('ERC20');
const AssetToken = artifacts.require('AssetToken');

let master, randomErc20, accounts;
const nullAddress = '0x0000000000000000000000000000000000000000';

before('Deploy master contract', async () => {
  master = await Master.new();
});

describe('Master Deployment', () => {
  it('Get accounts', async () => {
    accounts = await web3.eth.getAccounts();
  });
  it('Deploy master contract', async () => {
    assert.exists(master.address, 'Master has an address')
  });
  it('Master has empty assets array', async () => {
    let assetArray = await master.getAllAssets();
    assert.isEmpty(assetArray, 'Master has assets')
  });

  describe('Deploy random Erc20', () => {
    before('Deploy random Erc20 contract', async () => {
      randomErc20 = await ERC20.new();
    });
    it('Deploy Dai contract', async () => {
      assert.exists(randomErc20.address, 'random Erc20 is not deployed')
    });  
  });

  describe('Adding an Asset', () => {
    
    let docUrl = 'https://abc.com';
    let email = 'my@email.com';
    let blockNumber, now;
  
    it('set now', async() => {
      blockNumber = await web3.eth.getBlockNumber();
      now = (await web3.eth.getBlock(blockNumber)).timestamp;
    })
  
    it('Add an asset', async() => {
      user1 = accounts[1];
      let newAssetTx = await master.addAsset(docUrl, now + 100, true, email, randomErc20.address, 'Token1', 'TKN1', 18, web3.utils.toWei('1', 'ether'), {
        from: user1
      });
  
      assert.equal(newAssetTx.logs.length, 1, 'Not 1 event');
      const log = newAssetTx.logs[0];
      const args = newAssetTx.logs[0].args;
      assert.equal(log.event, 'AssetAdded', 'Event name');
      assert.exists(args.url, 'document url');
      assert.equal(args.ownerAddress, user1, 'user address');
      assert.equal(args.paymentToken, randomErc20.address, 'payment token');
      assert.equal(web3.utils.toHex(args.dueDate), web3.utils.toHex(now + 100), 'due date');
      assert.equal(args.initialSupply, web3.utils.toWei('1', 'ether'), 'initial mint amount');

      let allAssets = await master.getAllAssets();
      assert.equal(allAssets.length, 1, 'number of asset contracts');
      assert.equal(allAssets[0], args.assetAddress, 'new added asset address');
      const assetContract = await AssetToken.at(allAssets[0]);
      assert.equal(await assetContract.collectBuyerDetails.call(), true, 'buyer detail switch');
      assert.equal(await assetContract.state.call(), 0, 'initial state enum');
      assert.equal(web3.utils.toHex(await assetContract.dueDate.call()), web3.utils.toHex(now + 100), 'due date');
      assert.equal(await assetContract.erc20Token.call(), randomErc20.address, 'payment token');
      assert.equal(await assetContract.owner.call(), user1, 'deployer or user1');
      assert.equal(await assetContract.ownerEmail.call(), email, 'user email');
      assert.equal(await assetContract.documentUrl.call(), docUrl, 'documet url');
      
      // asset token
      assert.equal(await assetContract.name(), 'Token1', 'token name');
      assert.equal(await assetContract.symbol(), 'TKN1', 'token symbol');
      assert.equal(await assetContract.decimals(), 18, 'token decimals');
      assert.equal(await assetContract.totalSupply(), web3.utils.toWei('1', 'ether'), 'token totalsupply');
      assert.equal(await assetContract.balanceOf(user1), web3.utils.toWei('1', 'ether'), 'token balance of user 1');
    }) 
  });
});

