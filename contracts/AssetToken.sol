
pragma solidity 0.5.16;

import "./external/ERC20.sol";
import "./external/ERC20Detailed.sol";

contract AssetToken is ERC20, ERC20Detailed {

    enum State {Initialized, Settled}

    bool public collectBuyerDetails;
    State public state;
    uint256 public dueDate;
    address public erc20Token;
    address public ownerAddress;
    string public ownerEmail;
    string public documentUrl;

    constructor(string memory _url, uint256 _dueDate, bool _collectBuyerDetails, string memory _email, address _erc20Token,
        string memory _name, string memory _symbol, uint8 _decimals, uint256 _supplyToMint, address _owner
    ) ERC20Detailed(_name, _symbol, _decimals)
      public {
        require(bytes(_url).length != 0, "Empty document url");
        require(_dueDate > now, "Due date has already passed");     // maybe duedate is optional

        IERC20(_erc20Token).totalSupply;
        erc20Token = _erc20Token;
        documentUrl = _url;
        dueDate = _dueDate;
        ownerAddress = _owner;
        collectBuyerDetails = _collectBuyerDetails;
        if (collectBuyerDetails) {
            ownerEmail = _email;
        }
        _mint(_owner, _supplyToMint);
    }

    function mintTokens(uint256 amount) public {
        require(msg.sender == ownerAddress, "Caller is not Owner");

        _mint(ownerAddress, amount);
    }

    /**
     * @dev Destoys `amount` tokens from the caller.
     *
     * See `ERC20._burn`.
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    /**
     * @dev See `ERC20._burnFrom`.
     */
    function burnFrom(address account, uint256 amount) public {
        _burnFrom(account, amount);
    }

    function buyToken() public {
        
    }

    function redeemToken() public {
        
    }
}