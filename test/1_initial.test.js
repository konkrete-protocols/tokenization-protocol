const Master = artifacts.require('Master');
const ERC20 = artifacts.require('ERC20');

let master, randomErc20, accounts;

before('Deploy master contract', async () => {
  master = await Master.deployed();
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
    
    let docUrl = web3.utils.toHex('aa');
    let email = web3.utils.toHex('my@email.com');
    let blockNumber, now;
  
    it('set now', async() => {
      blockNumber = await web3.eth.getBlockNumber();
      now = (await web3.eth.getBlock(blockNumber)).timestamp;
    })
  
    it('Add an asset', async() => {
      user1 = accounts[1];
      let newAssetTx = await master.addAsset(docUrl, now + 100, true, email, randomErc20.address, 'Token1', 'TKN1', web3.utils.toWei('1', 'ether'), {
        from: user1
      });
  
      assert.equal(newAssetTx.logs.length, 1, 'Not 1 event');
      const log = newAssetTx.logs[0];
      const args = newAssetTx.logs[0].args;
      assert.equal(log.event, 'AssetAdded', 'Event name');
      assert.equal(web3.utils.toUtf8(args.url), web3.utils.toUtf8(docUrl), 'document url');
      assert.equal(args.ownerAddress, user1, 'user address');
      assert.equal(args.paymentToken, randomErc20.address, 'payment token');
      assert.equal(web3.utils.toHex(args.dueDate), web3.utils.toHex(now + 100), 'due date');
      assert.equal(args.initialSupply, web3.utils.toWei('1', 'ether'), 'initial mint amount');
    }) 
  });
});

