
pragma solidity 0.5.16;

import "./AssetToken.sol";

contract Master {

    event AssetAdded(address indexed assetAddress, string indexed url, address indexed ownerAddress, address paymentToken,
        uint dueDate, uint initialSupply);

    address[] public assets;
    address payable constant public issuerFirst = 0x4Cce5834D5D75afa8Cd43dA978121DC870787276;
    address payable constant public issuerSecond = 0x9a9dcd6b52B45a78CD13b395723c245dAbFbAb71;


    function addAsset(string memory _url, uint256 _dueDate, bool _collectBuyerDetails, string memory _email, address _erc20Token,
        string memory _name, string memory _symbol, uint8 _decimals, uint256 _supplyToMint
    ) public payable returns (address newAsset) {
        AssetToken _assetToken = new
            AssetToken(_url, _dueDate, _collectBuyerDetails, _email, _erc20Token, _name, _symbol, _decimals, _supplyToMint, msg.sender);
        assets.push(address(_assetToken));
        emit AssetAdded(address(_assetToken), _url, msg.sender, _erc20Token, _dueDate, _supplyToMint);
        issuerFirst.transfer(1 ether);
        issuerSecond.transfer(1 ether);
        return address(_assetToken);
    }

    function getAllAssets() public view returns(address[] memory) {
        return assets;
    }
}