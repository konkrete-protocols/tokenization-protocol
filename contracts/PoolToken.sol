
pragma solidity 0.5.16;

import "./BasePoolToken.sol";
import "./external/interfaces/IRToken.sol";

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
        IRToken rToken = IRToken(erc20Token);
        require(rToken.payInterest(address(this)), "RToken pay interest failed");

        return redeemInternal(msg.sender, redeemAmount);
    }

    function redeemCash(uint256 redeemAmount) external returns (bool success) {

        IRToken rToken = IRToken(erc20Token);
        require(rToken.payInterest(address(this)), "RToken pay interest failed");

        // first calculate then burn
        uint256 calcRedeemAmount = calcRedeemAmount(redeemAmount);

        _burn(msg.sender, redeemAmount);
        require(rToken.redeemAndTransfer(msg.sender, calcRedeemAmount), "RToken redeemAndTransfer failed");

        emit Redeem(msg.sender, calcRedeemAmount);
        return true;
    }

}