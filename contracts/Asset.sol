
pragma solidity 0.5.16;

import "./AssetToken.sol";
import "./external/interfaces/IERC20.sol";

contract Asset {

    enum State {Initialized, Settled}

    bool public collectBuyerDetails;
    State public state;
    uint256 public dueDate;
    address public assetToken;
    address public erc20Token;
    address public ownerAddress;
    string public ownerEmail;
    string public documentUrl;

    constructor(string memory _url, uint256 _dueDate, bool _collectBuyerDetails, string memory _email, address _erc20Token,
        string memory _name, string memory _symbol, uint8 _decimals, uint256 _supplyToMint, address _owner
    ) public {
        require(bytes(_url).length != 0, "Empty document url");
        require(_dueDate > now, "Due date has already passed");

        IERC20(_erc20Token).totalSupply;
        erc20Token = _erc20Token;
        documentUrl = _url;
        dueDate = _dueDate;
        ownerAddress = _owner;
        collectBuyerDetails = _collectBuyerDetails;
        if (collectBuyerDetails) {
            ownerEmail = _email;
        }
        assetToken = address(new AssetToken(_name, _symbol, _decimals));
        AssetToken(assetToken).mint(_owner, _supplyToMint);
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