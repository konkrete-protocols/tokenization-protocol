
pragma solidity 0.5.16;

import "./external/ERC20.sol";
import "./external/ERC20Detailed.sol";
import "./external/Ownable.sol";
import "./external/SafeMath.sol";

contract BasePoolToken is ERC20, ERC20Detailed, Ownable {
    using SafeMath for uint256;

    event Redeem(address indexed account, uint256 indexed amount);

    /**
     * @dev Guard variable for re-entrancy checks
     */
    bool internal _notEntered;

    address public erc20Token;

    constructor(address _erc20Token, string memory _name, string memory _symbol, uint8 _decimals
    ) ERC20Detailed(_name, _symbol, _decimals)
      internal {
        IERC20(_erc20Token).totalSupply;
        erc20Token = _erc20Token;

        // The counter starts true to prevent changing it from zero to non-zero (i.e. smaller cost/refund)
        _notEntered = true;
    }

    function redeemInternal(address payable redeemer, uint256 inputAmount) internal nonReentrant returns (bool success) {
        IERC20 Erc20Token = IERC20(erc20Token);
        uint256 circulationSupply = totalSupply().sub(balanceOf(owner()));

        uint256 poolBalance = Erc20Token.balanceOf(address(this));
        uint256 redeemAmount = inputAmount.mul(poolBalance).div(circulationSupply);

        _burn(redeemer, inputAmount);

        require(Erc20Token.balanceOf(address(this)) >= redeemAmount, "Insufficient Funds");
        doTransferOut(redeemer, redeemAmount);

        emit Redeem(redeemer, redeemAmount);

        return true;
    }

    /**
     * @dev Similar to EIP20 transfer, except it handles a False success from `transfer` and returns an explanatory
     *      error code rather than reverting. If caller has not checked protocol's balance, this may revert due to
     *      insufficient cash held in this contract. If caller has checked protocol's balance prior to this call, and verified
     *      it is >= amount, this should not revert in normal conditions.
     *
     *      Note: This wrapper safely handles non-standard ERC-20 tokens that do not return a value.
     *            See here: https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca
     */
    function doTransferOut(address payable to, uint amount) internal {
        IERC20 token = IERC20(erc20Token);
        token.transfer(to, amount);

        bool success;
        assembly {
            switch returndatasize()
                case 0 {                      // This is a non-standard ERC-20
                    success := not(0)          // set success to true
                }
                case 32 {                     // This is a complaint ERC-20
                    returndatacopy(0, 0, 32)
                    success := mload(0)        // Set `success = returndata` of external call
                }
                default {                     // This is an excessively non-compliant ERC-20, revert.
                    revert(0, 0)
                }
        }
        require(success, "TOKEN_TRANSFER_OUT_FAILED");
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

    /*** Reentrancy Guard ***/
    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     */
    modifier nonReentrant() {
        require(_notEntered, "re-entered");
        _notEntered = false;
        _;
        _notEntered = true; // get a gas-refund post-Istanbul
    }
}