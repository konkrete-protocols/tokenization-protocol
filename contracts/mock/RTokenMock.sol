pragma solidity 0.5.16;

import "./TestERC20.sol";
// import "../external/interfaces/IRToken.sol";


// *** Should implement all IRToken functions for mock?
// contract RTokenMock is TestERC20, IRToken {

contract RTokenMock is TestERC20 {

    event InterestPaid(address indexed recipient, uint256 amount);
    event TransferZ(address indexed from, address indexed to, uint256 value);

    uint256 public interestAmount;
    TestERC20 public token;

    constructor (string memory name, string memory symbol, uint8 decimals, address underlying)
        TestERC20(name, symbol, decimals)
    public {
        token = TestERC20(underlying);
    }

    function setInterestAmount(uint256 amount) external {
        interestAmount = amount;
    }

    function payInterest(address owner) external returns (bool) {
        _mint(owner, interestAmount);
        emit InterestPaid(owner, interestAmount);
        return true;
    }

    function interestPayableOf(address owner) external view returns (uint256 amount) {
        owner;      // unused
        return interestAmount;
    }

    function redeemAndTransfer(address redeemTo, uint256 redeemTokens)
        external
        returns (bool)
    {
        _burn(msg.sender, redeemTokens);
        token.mint(redeemTo, redeemTokens);
        return true;
    }
}
