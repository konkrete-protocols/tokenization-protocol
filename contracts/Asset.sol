
pragma solidity 0.5.16;

import "./AssetToken.sol";
import "./external/interfaces/IERC20.sol";

contract Asset {

    bool public collectBuyerDetails;
    uint256 public dueDate;
    address public assetToken;
    address public erc20Token;
    address public ownerAddress;
    bytes32 public ownerEmail;
    bytes32 public documentUrl;

    constructor(bytes32 _url, uint256 _dueDate, bool _collectBuyerDetails, bytes32 _email, address _erc20Token,
        string memory _name, string memory _symbol, uint256 _supplyToMint
    ) public {
        require(_url != "", "Empty document url");
        require(_dueDate > now, "Due date has already passed");

        IERC20(_erc20Token).totalSupply;
        erc20Token = _erc20Token;
        documentUrl = _url;
        dueDate = _dueDate;
        ownerAddress = msg.sender;
        collectBuyerDetails = _collectBuyerDetails;
        if (collectBuyerDetails) {
            ownerEmail = _email;
        }
        assetToken = address(new AssetToken(_name, _symbol));
        AssetToken(assetToken).mint(msg.sender, _supplyToMint);
    }

    function mintTokens(uint256 amount) public {
        require(msg.sender == ownerAddress, "Caller is not Owner");

        AssetToken(assetToken).mint(ownerAddress, amount);
    }

    function buyToken() public {
        
    }

    function redeemToken() public {
        
    }
}