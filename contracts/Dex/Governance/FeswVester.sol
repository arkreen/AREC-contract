// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./utils/SafeMath.sol";

interface IFeswap {
    function balanceOf(address account) external view returns (uint);
    function transfer(address dst, uint rawAmount) external returns (bool);
}

contract FeswVester {
    using SafeMath for uint;

    address public Fesw;
    address public recipient;

    uint public vestingAmount;
    uint public vestingBegin;
    uint public vestingCliff;
    uint public vestingEnd;

    uint public lastUpdate;

    constructor(
        address Fesw_,
        address recipient_,
        uint vestingAmount_,
        uint vestingBegin_,
        uint vestingCliff_,
        uint vestingEnd_
    ) {
        require(vestingBegin_ >= block.timestamp, 'FeswVester::constructor: vesting begin too early');
        require(vestingCliff_ >= vestingBegin_, 'FeswVester::constructor: cliff is too early');
        require(vestingEnd_ > vestingCliff_, 'FeswVester::constructor: end is too early');

        Fesw = Fesw_;
        recipient = recipient_;

        vestingAmount = vestingAmount_;
        vestingBegin = vestingBegin_;
        vestingCliff = vestingCliff_;
        vestingEnd = vestingEnd_;

        lastUpdate = vestingBegin;
    }

    function setRecipient(address recipient_) public {
        require(msg.sender == recipient, 'FeswVester::setRecipient: unauthorized');
        recipient = recipient_;
    }

    function claim() public {
        require(block.timestamp >= vestingCliff, 'FeswVester::claim: not time yet');
        uint amount;
        if (block.timestamp >= vestingEnd) {
            amount = IFeswap(Fesw).balanceOf(address(this));
        } else {
            amount = vestingAmount.mul(block.timestamp - lastUpdate).div(vestingEnd - vestingBegin);
            lastUpdate = block.timestamp;
        }
        IFeswap(Fesw).transfer(recipient, amount);
    }
}
