// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

abstract contract RewardsTwinDistributionRecipient {
    address public rewardsDistribution;

    function notifyRewardAmount(uint256 reward, uint256 _rewardsDuration) external virtual;

    modifier onlyRewardsDistribution() {
        require(msg.sender == rewardsDistribution, "Caller is not RewardsDistribution contract");
        _;
    }
}