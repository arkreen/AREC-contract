// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StakingRewards is ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 public constant MAX_SUPPLY_STAKES = 1e28;                 // AKRE max supply: 10 Billion

    IERC20 public stakingToken;
    IERC20 public rewardsToken;
    IERC20 public ArkreenMiner;

    address public rewardsDistributor;

    uint256 public totalStakes;
    uint256 public rewardRate;

    uint160 public rewardPerStakeLast;

    uint32 public periodStart;
    uint32 public periodEnd;
    uint32 public lastUpdateTime;

    mapping(address => uint256) public myRewardsPerStakePaid;
    mapping(address => uint256) public myRewards;
    mapping(address => uint256) public myStakes;

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(
        address _stakingToken,
        address _rewardsToken,
        address _rewardsDistributor
    ) {
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
        rewardsDistributor = _rewardsDistributor;
    }

    modifier onlyRewardsDistributor() {
        require(msg.sender == rewardsDistributor, "Caller is not RewardsDistribution contract");
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        if (block.timestamp <= periodStart) return periodStart;
        return (block.timestamp < periodEnd) ? block.timestamp : periodEnd;
    }

    function rewardPerToken() public view returns (uint256) {
        if ((block.timestamp <= periodStart) || (totalStakes == 0)) return rewardPerStakeLast;
        return uint256(rewardPerStakeLast).add(lastTimeRewardApplicable().sub(lastUpdateTime).mul(rewardRate).div(totalStakes));
    }

    function earned(address account) public view returns (uint256) {
        return myStakes[account].mul(rewardPerToken().sub(myRewardsPerStakePaid[account])).div(MAX_SUPPLY_STAKES).add(myRewards[account]);
    }

    function getRewardForDuration() external view returns (uint256) {
        return rewardRate.mul(periodEnd - periodStart).div(MAX_SUPPLY_STAKES);
    }

    function stakeWithPermit(uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        totalStakes = totalStakes.add(amount);
        myStakes[msg.sender] = myStakes[msg.sender].add(amount);

        IERC20Permit(address(stakingToken)).permit(msg.sender, address(this), amount, deadline, v, r, s);

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        totalStakes = totalStakes.add(amount);
        myStakes[msg.sender] = myStakes[msg.sender].add(amount);
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot unstake 0");
        totalStakes = totalStakes.sub(amount);
        myStakes[msg.sender] = myStakes[msg.sender].sub(amount);
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function collectReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = myRewards[msg.sender];
        if (reward > 0) {
            myRewards[msg.sender] = 0;
            rewardsToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function exitStaking() external {
        unstake(myStakes[msg.sender]);
        collectReward();
    }

    function depolyRewards(uint256 start, uint256 end, uint256 rewardTotal) external onlyRewardsDistributor updateReward(address(0)) {
        // following reward round can only be started after the previous round completed
        require ((start > periodEnd) && (start > block.timestamp ) && (end > start), "Wrong period");
        periodStart = uint32(start);
        periodEnd = uint32(end);

        rewardsToken.safeTransferFrom(msg.sender, address(this), rewardTotal);
        rewardRate = rewardTotal.mul(MAX_SUPPLY_STAKES).div(end - start);                          // For accuracy
        lastUpdateTime = uint32(start);

        emit RewardAdded(rewardTotal);
    }

    // If staking reward period is started, but no one stake, the reward unpaid will be kept.
    // This situation could be easily avoided by staking before the reward period !!!   
    modifier updateReward(address account) {
        rewardPerStakeLast = uint160(rewardPerToken());
        lastUpdateTime = uint32(lastTimeRewardApplicable());

        if (account != address(0)) {
            myRewards[account] = earned(account);
            myRewardsPerStakePaid[account] = rewardPerStakeLast;
        }
        _;
    }
}
