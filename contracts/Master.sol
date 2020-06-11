
pragma solidity 0.5.16;

import "./AssetToken.sol";

contract Master {

    event AssetAdded(address indexed assetAddress, string indexed url, address indexed ownerAddress, address paymentToken,
        uint dueDate, uint initialSupply);

    address[] public assets;

    function addAsset(string memory _url, uint256 _dueDate, bool _collectBuyerDetails, string memory _email, address _erc20Token,
        string memory _name, string memory _symbol, uint8 _decimals, uint256 _supplyToMint
    ) public returns (address newAsset) {
        AssetToken _assetToken = new
            AssetToken(_url, _dueDate, _collectBuyerDetails, _email, _erc20Token, _name, _symbol, _decimals, _supplyToMint, msg.sender);
        assets.push(address(_assetToken));
        emit AssetAdded(address(_assetToken), _url, msg.sender, _erc20Token, _dueDate, _supplyToMint);
        return address(_assetToken);
    }

    function getAllAssets() public view returns(address[] memory) {
        return assets;
    }
}