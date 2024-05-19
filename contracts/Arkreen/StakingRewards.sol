// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-IERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "../interfaces/IArkreenMiner.sol";
import "../interfaces/IArkreenMinerListener.sol";

contract StakingRewards is IArkreenMinerListener, ReentrancyGuardUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for ERC20Upgradeable;

    uint256 public constant MAX_SUPPLY_STAKES = 1e36;                 // Decide calculation accuracy

    ERC20Upgradeable public stakingToken;
    ERC20Upgradeable public rewardsToken;
    IArkreenMiner public arkreenMiner;

    address public rewardsDistributor;

    uint128 public capMinerPremium;
    uint32  public ratePremium;

    uint256 public totalStakes;
    uint256 public totalRewardStakes;
    uint256 public rewardRate;

    uint160 public rewardPerStakeLast;

    uint32 public periodStart;
    uint32 public periodEnd;
    uint32 public lastUpdateTime;

    mapping(address => uint256) public myRewardsPerStakePaid;
    mapping(address => uint256) public myRewards;
    mapping(address => uint256) public myStakes;
    mapping(address => uint256) public myRewardStakes;

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize( address _stakingToken, 
                         address _rewardsToken, 
                         address _arkreenMiner, 
                         address _rewardsDistributor
                       ) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();     
        __ReentrancyGuard_init();   
        
        stakingToken = ERC20Upgradeable(_stakingToken);
        rewardsToken = ERC20Upgradeable(_rewardsToken);
        arkreenMiner = IArkreenMiner(_arkreenMiner);
        rewardsDistributor = _rewardsDistributor;
    }   

    function postUpdate() external onlyProxy onlyOwner 
    {}

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    modifier onlyRewardsDistributor() {
        require(msg.sender == rewardsDistributor, "Caller is not RewardsDistribution contract");
        _;
    }

    modifier onlyArkreenMiner() {
        require(msg.sender == address(arkreenMiner), "Caller Not Allowed");
        _;
    }

    function setStakeParameter(uint256 newPremiumCap, uint256 newPremiumRate) public onlyOwner{
        if (newPremiumCap != 0) {
            capMinerPremium = uint128(newPremiumCap);
        }
        if (newPremiumRate != 0) {
            ratePremium = uint32(newPremiumRate);
        }
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        if (block.timestamp <= periodStart) return periodStart;
        return (block.timestamp < periodEnd) ? block.timestamp : periodEnd;
    }

    function rewardPerToken() public view returns (uint256) {
        if ((block.timestamp <= periodStart) || (totalRewardStakes == 0)) return rewardPerStakeLast;
        return uint256(rewardPerStakeLast).add(lastTimeRewardApplicable().sub(lastUpdateTime).mul(rewardRate).div(totalRewardStakes));
    }

    function earned(address account) public view returns (uint256) {
        return myRewardStakes[account].mul(rewardPerToken().sub(myRewardsPerStakePaid[account])).div(MAX_SUPPLY_STAKES).add(myRewards[account]);
    }

    function getRewardForDuration() external view returns (uint256) {
        return rewardRate.mul(periodEnd - periodStart).div(MAX_SUPPLY_STAKES);
    }

    function stakeWithPermit(uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external nonReentrant updateReward(msg.sender) {
        IERC20PermitUpgradeable(address(stakingToken)).permit(msg.sender, address(this), amount, deadline, v, r, s);
        _stake(amount);
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        _stake(amount);
    }

    function _stake(uint256 amount) internal {
        require(amount > 0, "Cannot stake 0");
        totalStakes = totalStakes.add(amount);
        myStakes[msg.sender] = myStakes[msg.sender].add(amount);
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        _updateRewardStake(msg.sender);
        emit Staked(msg.sender, amount);
    }

    function _updateRewardStake(address staker) internal {
        uint256 totalMiners = arkreenMiner.balanceOf(staker);
        uint256 premium = totalMiners * capMinerPremium;
        uint256 othersTotalRewardStakes = totalRewardStakes - myRewardStakes[staker];

        uint256 rewardStakes;
        if (myStakes[staker] <= premium) {
            rewardStakes = myStakes[staker] * ratePremium / 100 ;                     // All stakes are premium stake
        } else {
            rewardStakes = myStakes[staker] +  premium * (ratePremium - 100) / 100;   // Cap is premium 
        }
                
        myRewardStakes[staker] = rewardStakes;
        totalRewardStakes = othersTotalRewardStakes + rewardStakes;
    }

    function unstake(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot unstake 0");
        totalStakes = totalStakes.sub(amount);
        myStakes[msg.sender] = myStakes[msg.sender].sub(amount);
        stakingToken.safeTransfer(msg.sender, amount);

        _updateRewardStake(msg.sender);
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

    function minerOnboarded(address owner, uint256) external onlyArkreenMiner updateReward(owner) {
        _updateRewardStake(owner);
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
            if ((myRewardsPerStakePaid[account] == 0) && (myStakes[account] == 0)) {
              	IArkreenMiner(arkreenMiner).registerListener(account);
            }

            myRewards[account] = earned(account);
            myRewardsPerStakePaid[account] = rewardPerStakeLast;
        }
        _;
    }
}
