
pragma solidity 0.5.16;

import "./Asset.sol";

contract Master {

    event AssetAdded(address indexed assetAddress, bytes32 indexed url, address indexed ownerAddress, address paymentToken,
        uint dueDate, uint initialSupply);

    address[] public assets;

    function addAsset(bytes32 _url, uint256 _dueDate, bool _collectBuyerDetails, bytes32 _email, address _erc20Token,
        string memory _name, string memory _symbol, uint256 _supplyToMint
    ) public returns (address newAsset) {
        Asset _asset = new Asset(_url, _dueDate, _collectBuyerDetails, _email, _erc20Token, _name, _symbol, _supplyToMint, msg.sender);
        assets.push(address(_asset));
        emit AssetAdded(address(_asset), _url, msg.sender, _erc20Token, _dueDate, _supplyToMint);
        return address(_asset);
    }

    function getAllAssets() public view returns(address[] memory) {
        return assets;
    }
}