
pragma solidity 0.5.16;

import "./BasePoolToken.sol";

contract PoolToken is BasePoolToken {
    using SafeMath for uint256;

    constructor(address _erc20Token, string memory _name, string memory _symbol, uint8 _decimals, uint256 _supplyToMint
    ) BasePoolToken(_erc20Token, _name, _symbol, _decimals)
      public {
        _mint(msg.sender, _supplyToMint);
    }

    function mintPoolTokens(uint256 amount) external onlyOwner returns (bool) {
        _mint(msg.sender, amount);
        return true;
    }

    function redeem(uint256 redeemAmount) external returns (bool success) {
        // TODO fetch liquidity

        return redeemInternal(msg.sender, redeemAmount);
    }

}