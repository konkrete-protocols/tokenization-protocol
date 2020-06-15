
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

    function mintAssetTokens(uint256 amount) external returns (bool) {
        require(msg.sender == ownerAddress, "Caller is not Owner");

        _mint(ownerAddress, amount);
        return true;
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

    function mint(uint256 mintAmount) external returns (bool) {
        require(
            IERC20(erc20Token).allowance(msg.sender, address(this)) >= mintAmount,
            "Not enough allowance"
        );


    }

    function redeem() public {
        
    }

    /**
     * @dev Similar to EIP20 transfer, except it handles a False result from `transferFrom` reverts in that case. This function
     *      returns the actual amount received, with may be less than `amount` if there is a fee attached with the transfer.
     *
     *      Note: This wrapper safely handles non-standard ERC-20 tokens that do not return a value.
     *            See here: https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca
     */
    function doTransferIn(address from, uint amount) internal returns (uint) {
        IERC20 token = IERC20(erc20Token);
        uint balanceBefore = IERC20(erc20Token).balanceOf(address(this));
        token.transferFrom(from, address(this), amount);

        bool success;
        assembly {
            switch returndatasize()
                case 0 {                       // This is a non-standard ERC-20
                    success := not(0)          // set success to true
                }
                case 32 {                      // This is a compliant ERC-20
                    returndatacopy(0, 0, 32)
                    success := mload(0)        // Set `success = returndata` of external call
                }
                default {                      // This is an excessively non-compliant ERC-20, revert.
                    revert(0, 0)
                }
        }
        require(success, "TOKEN_TRANSFER_IN_FAILED");

        // Calculate the amount that was *actually* transferred
        uint balanceAfter = IERC20(erc20Token).balanceOf(address(this));
        require(balanceAfter >= balanceBefore, "TOKEN_TRANSFER_IN_OVERFLOW");
        return balanceAfter - balanceBefore;   // underflow already checked above, just subtract
    }
}