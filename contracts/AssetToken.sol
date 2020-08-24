
pragma solidity 0.5.16;

import "./BasePoolToken.sol";

contract AssetToken is BasePoolToken {

    enum State { Initialized, Settled }

    bool public collectBuyerDetails;
    State public state;
    uint256 public dueDate;
    string public ownerEmail;
    string public documentUrl;

    constructor(string memory _url, uint256 _dueDate, bool _collectBuyerDetails, string memory _email, address _erc20Token,
        string memory _name, string memory _symbol, uint8 _decimals, uint256 _supplyToMint, address _owner
    ) BasePoolToken(_erc20Token, _name, _symbol, _decimals)
      public {
        require(bytes(_url).length != 0, "Empty document url");

        documentUrl = _url;
        dueDate = _dueDate;
        collectBuyerDetails = _collectBuyerDetails;
        if (collectBuyerDetails) {
            ownerEmail = _email;
        }
        _transferOwnership(_owner);
        _mint(_owner, _supplyToMint);
    }

    function mintAssetTokens(uint256 amount) external onlyOwner returns (bool) {
        _mint(msg.sender, amount);
        return true;
    }

    function redeem(uint256 amount) external returns (bool success) {
        return redeemInternal(msg.sender, amount);
    }

}