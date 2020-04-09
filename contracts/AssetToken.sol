
pragma solidity ^0.5.16;

import "./external/ERC20.sol";
import "./external/ERC20Detailed.sol";
import "./external/Ownable.sol";

/**
 * @dev Extension of `ERC20`
 */
contract AssetToken is ERC20, ERC20Detailed, Ownable {

    /**
     * @dev Sets the values for `name`, `symbol`, and `decimals`. All three of
     * these values are immutable: they can only be set once during
     * construction.
     */
    constructor (string memory name, string memory symbol, uint256 supply) ERC20Detailed(name, symbol, 18) public {
        _mint(msg.sender, supply);
    }

    /**
     * @dev See `ERC20._mint`.
     */
    function mint(address account, uint256 amount) public onlyOwner returns (bool) {
        _mint(account, amount);
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
}