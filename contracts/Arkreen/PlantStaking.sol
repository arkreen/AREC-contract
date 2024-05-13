// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract PlantStaking is OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {

    bytes32 public _DOMAIN_SEPARATOR;
    IERC20Upgradeable public stakingToken;
    IERC20Upgradeable public rewardsToken;
    address public rewarder;
    address public manager;

    // keccak256("stake(address staker,uint256 amount,uint256 nonce,uint256 deadline)");
    bytes32 public constant STAKE_TYPEHASH = 0x1373FE6EB1B91DF1E25D62EF7B059F58B23CFC3A653EFD61E2F2D5D9EA33EEDB;  

    // keccak256("unstake(address staker,uint256 amount,uint256 reward,uint256 nonce,uint256 deadline)");
    bytes32 public constant UNSTAKE_TYPEHASH = 0x2174EF2DF701BB3EAA5CDE6DCDC70511CB9F1C387439FE1B7ACF2D7A943FEFC1;  

    struct StakeInfo {
        uint32  nonce;
        uint128 amountStake;
        uint128 rewardStake;
    }  

    struct Sig {
        uint8       v;
        bytes32     r;
        bytes32     s;              
    }

    mapping(address => StakeInfo) public stakeInfo;

    uint128 public totalStake;
    uint128 public totalReward;

    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, "Deadline Expired!");
        _;
    }

    event Stake(address indexed staker, uint256 amount);
    event Unstake(address indexed staker, uint256 amount, uint256 reward);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _stakingToken, address _rewardsToken, address _rewarder, address _manager) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();        
        stakingToken = IERC20Upgradeable(_stakingToken);
        rewardsToken = IERC20Upgradeable(_rewardsToken);
        manager = _manager;
        rewarder = _rewarder;

        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes("Plant Miner Staking")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );  
    }   

    function postUpdate() external onlyProxy onlyOwner 
    {}

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    modifier onlyManager(){
        require(msg.sender == manager, "CLAIM: Not Manager");
        _;
    }

    function changeManager(address newManager, address newRewarder) external onlyManager {
        if (newManager != address(0))  manager = newManager;
        if (newRewarder != address(0)) rewarder = newRewarder;
    }

    function stake(uint256 amount, uint256 deadline, Sig calldata signature) external nonReentrant ensure(deadline){
        bytes32 stakeHash = keccak256(abi.encode(STAKE_TYPEHASH, msg.sender, amount, stakeInfo[msg.sender].nonce, deadline));
        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', _DOMAIN_SEPARATOR, stakeHash));
        address managerAddress = ECDSAUpgradeable.recover(digest, signature.v, signature.r, signature.s);

        require(managerAddress == manager, "Stake Not Allowed");

        stakeInfo[msg.sender].nonce =  stakeInfo[msg.sender].nonce + 1;
        stakeInfo[msg.sender].amountStake =  stakeInfo[msg.sender].amountStake + uint128(amount);   // imposssible overflow for AKRE
        totalStake = totalStake + uint128(amount);

        require(IERC20Upgradeable(stakingToken).transferFrom(msg.sender, address(this), amount));

        emit Stake(msg.sender, amount);
    }

    function unstake(uint256 amount, uint256 reward, uint256 deadline, Sig calldata signature) external nonReentrant ensure(deadline){
        bytes32 unstakeHash = keccak256(abi.encode(UNSTAKE_TYPEHASH, msg.sender, amount, reward, stakeInfo[msg.sender].nonce, deadline));
        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', _DOMAIN_SEPARATOR, unstakeHash));
        address managerAddress = ECDSAUpgradeable.recover(digest, signature.v, signature.r, signature.s);

        require(managerAddress == manager, "Unstake Not Allowed");
        require(stakeInfo[msg.sender].amountStake >= uint128(amount), "Unstake Overflowed");

        stakeInfo[msg.sender].nonce =  stakeInfo[msg.sender].nonce + 1;

        stakeInfo[msg.sender].amountStake = stakeInfo[msg.sender].amountStake - uint128(amount);   // imposssible overflow for AKRE
        stakeInfo[msg.sender].rewardStake = stakeInfo[msg.sender].rewardStake + uint128(reward);
        totalReward = totalReward + uint128(reward);

        require(IERC20Upgradeable(stakingToken).transferFrom(rewarder, address(this), reward));
        require(IERC20Upgradeable(stakingToken).transferFrom(address(this), msg.sender, amount + reward));
        emit Unstake(msg.sender, amount, reward);
    }
}