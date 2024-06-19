// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "../interfaces/IkWhToken.sol";

contract GreenPower is OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {

    // keccak256("offset(uint256 txid,address staker,address cspminer,uint256 amount,uint256 nonce,uint256 deadline)");
    bytes32 public constant  OFFSET_TYPEHASH = 0xF970E4374212202D8F38B4CD5B1067E6B25AE9F3F76C60C2C45771C286C3F19D;  

    // keccak256("stake(uint256 txid,address staker,address cspminer,uint256 amount,uint256 period,uint256 nonce,uint256 deadline)");
    bytes32 public constant  STAKE_TYPEHASH = 0xF970E4374212202D8F38B4CD5B1067E6B25AE9F3F76C60C2C45771C286C3F19D;  

    // keccak256("unstake(uint256 txid,address staker,address cspminer,uint256 amount,uint256 nonce,uint256 deadline)");
    bytes32 public constant UNSTAKE_TYPEHASH = 0xDF27D93C407B51719EF6DE1C85A91844E20B5B3AFADCC7C5BF0828E9F5C6AAC3;  

    struct StakeInfo {
        uint96  amountStake;   							    // Enough for AKRE: 10**28 
        uint32  releaseTime;                                // Timestamp the stake can be released  
        uint32  nonce;
    }  

    struct Sig {
        uint8       v;
        bytes32     r;
        bytes32     s;              
    }

    struct OffsetAction {
        address   PlugMiner;
        uint48    offsetAmount;
    }  


    bytes32 public _DOMAIN_SEPARATOR;
    address public akreToken;
    address public kWhToken;
    address public manager;

    uint96 public totalStake;
    uint96 public totalOffset;

    // MSB0:12: Amount of stake, enough for 10**28 AKRE; MSB12:12: reserved; MSB24:4: nonce; MSB28:4: stake release time;
    mapping(address => uint256) public stakeInfo;       // mapping from user address to stake info

    // MSB0:20: Owner address; MSB20:2: reserved; MSB24:4: offset Count; MSB26:6: Total Offset (Unit: kWh);  
    mapping(address => uint256) public minerOffsetInfo; // mapping from plug miner address to offset info

    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, "Deadline Expired!");
        _;
    }

    event Offset(address indexed txid, address indexed greener, OffsetAction[] offsetActions, address tokenToPay, uint256 nonce);
    event Stake(address indexed txid, address indexed staker, address plugMiner, uint256 amount, uint256 period, uint256 nonce);
    event Unstake(address indexed txid, address indexed staker, address plugMiner, uint256 amount, uint256 nonce);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address akre, address kWh, address _manager) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();     
        __ReentrancyGuard_init();   
        akreToken = akre;
        kWhToken = kWh;
        manager = _manager;

        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes("Plug Miner ESG")),
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

    function changeManager(address newManager) external onlyOwner {
        if (newManager != address(0))  manager = newManager;
    }

    function offsetPower(
            address txid,
            OffsetAction[] calldata offsetActions,
            address tokenToPay,
            uint256 nonce,
            uint256 deadline,
            Sig calldata signature
        ) external nonReentrant ensure(deadline) 
    {
        {
            bytes32 offsetHash = keccak256(abi.encode(OFFSET_TYPEHASH, txid, msg.sender, offsetActions, tokenToPay, nonce, deadline));
            bytes32 digest = keccak256(abi.encodePacked('\x19\x01', _DOMAIN_SEPARATOR, offsetHash));
            address managerAddress = ECDSAUpgradeable.recover(digest, signature.v, signature.r, signature.s);

            require(managerAddress == manager, "Wrong Signature");
        }

        uint256 totalOffsetAmout = 0;
        for (uint256 index; index < offsetActions.length; index++) {
            address plugMiner = offsetActions[index].PlugMiner;
            if (minerOffsetInfo[plugMiner] == 0) {
                minerOffsetInfo[plugMiner] = (uint256(uint160(msg.sender)) << 96);
            } else {
                require (msg.sender == address(uint160(minerOffsetInfo[plugMiner] >> 96)), "Wrong Owner");
            }
            uint256 offsetAmount = offsetActions[index].offsetAmount;
            require ((offsetAmount >= (10**6)) && ((offsetAmount % (10**6)) == 0), "Wrong Offset Amount");
            
            // Total Offset Count, 4 Bytes; Total Offset: 6 Bytes, ~2.8 *(10**14) kWh; Assuming never overflow;
            minerOffsetInfo[plugMiner] += (1 << 48) + uint48(offsetAmount /(10**6));
            totalOffsetAmout += offsetAmount;
        }
       
        //function convertKWh(address tokenToPay, uint256 amountPayment) external nonReentrant returns (uint256) {
        uint256 price = IkWhToken(kWhToken).priceForSwap(tokenToPay);
        uint256 amountPayment = totalOffsetAmout * price / (10**6);
        require(IERC20Upgradeable(tokenToPay).transferFrom(msg.sender, address(this), amountPayment));
        
        uint256 amountToBurn = IkWhToken(kWhToken).convertKWh(tokenToPay, amountPayment);
        require (totalOffsetAmout == amountToBurn);

        IkWhToken(kWhToken).burn(amountToBurn);

        totalOffset = totalOffset + uint96(totalOffsetAmout);

        emit Offset(txid, msg.sender, offsetActions, tokenToPay, nonce);
    }

    function stake(address txid, address plugMiner, uint256 amount, uint256 period, uint256 nonce, uint256 deadline, Sig calldata signature) external nonReentrant ensure(deadline) {
        require (amount > 0, "Zero Stake"); 
        require (msg.sender == address(uint160(minerOffsetInfo[plugMiner] >> 96)), "Not Owner"); 
        
        uint256 userStakeInfo = stakeInfo[msg.sender];
        require (nonce == uint32(userStakeInfo >> 32), "Nonce Not Match");        // Check nonce 
        require ((period%30) == 0, "Wrong period");

        require ((block.timestamp + period) >= uint32(userStakeInfo), "Short Period");

        {
            bytes32 stakeHash = keccak256(abi.encode(STAKE_TYPEHASH, txid, msg.sender, plugMiner, amount, period, nonce, deadline));
            bytes32 digest = keccak256(abi.encodePacked('\x19\x01', _DOMAIN_SEPARATOR, stakeHash));
            address managerAddress = ECDSAUpgradeable.recover(digest, signature.v, signature.r, signature.s);
            require(managerAddress == manager, "Wrong Signature");
        }

        userStakeInfo = ((userStakeInfo >> 32) << 32) + uint32(block.timestamp + period);
        stakeInfo[msg.sender] = userStakeInfo + uint256(1 << 32) + uint256(amount << 96);

        totalStake = totalStake + uint96(amount);

        emit Stake(txid, msg.sender, plugMiner, amount, period, nonce);

        require(IERC20Upgradeable(akreToken).transferFrom(msg.sender, address(this), amount));
    }

    function unstake(address txid, address plugMiner, uint256 amount, uint256 nonce, uint256 deadline, Sig calldata signature) external nonReentrant ensure(deadline){
        require (amount > 0, "Zero Stake"); 
        require (msg.sender == address(uint160(minerOffsetInfo[plugMiner] >> 96)), "Not Owner"); 

        uint256 userStakeInfo = stakeInfo[msg.sender];
        require (nonce == uint32(userStakeInfo >> 32), "Nonce Not Match"); 

        require(uint96(userStakeInfo >> 96) >= amount, "Unstake Overflowed");
        require (block.timestamp >= uint32(userStakeInfo), "Not Released");

        {
            bytes32 unstakeHash = keccak256(abi.encode(UNSTAKE_TYPEHASH, txid, msg.sender, plugMiner, amount, nonce, deadline));
            bytes32 digest = keccak256(abi.encodePacked('\x19\x01', _DOMAIN_SEPARATOR, unstakeHash));
            address managerAddress = ECDSAUpgradeable.recover(digest, signature.v, signature.r, signature.s);
            require(managerAddress == manager, "Wrong Signature");
        }

        userStakeInfo += (1<<32);                                                       // nonce + 1
        userStakeInfo -= (amount << 96);                                                // update the amount of stake
        if ((userStakeInfo >> 96) == 0) userStakeInfo = (userStakeInfo >> 32) << 32;    // clear release time if thers is no stake
        stakeInfo[msg.sender] = userStakeInfo;                                          // save new stake info

        totalStake = totalStake - uint96(amount);

        require(IERC20Upgradeable(akreToken).transfer(msg.sender, amount));
        emit Unstake(txid, msg.sender, plugMiner, amount, nonce);
    }
}