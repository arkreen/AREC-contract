// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "../libraries/TransferHelper.sol";
import "../interfaces/IkWhToken.sol";

contract GreenPower is OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {

    // keccak256("offset(uint256 txid,address staker,(address plugMiner,uint256 offsetAmount)[],address tokenToPay,uint256 nonce,uint256 deadline)");
    bytes32 public constant  OFFSET_TYPEHASH  = 0xAA19A1F9E01266BCE4B0B002C45341A0B67477836193A3457FB9D3F248AECE80;

    // keccak256("stake(uint256 txid,address staker,address plugMiner,uint256 amount,uint256 period,uint256 nonce,uint256 deadline)");
    bytes32 public constant  STAKE_TYPEHASH   = 0xB13D25036831D18DBC6EEF2020BA657F13C7D378CFB74B36EF4C358851961CFA;

    // keccak256("unstake(uint256 txid,address staker,address plugMiner,uint256 amount,uint256 nonce,uint256 deadline)");
    bytes32 public constant UNSTAKE_TYPEHASH  = 0xEEC4B573720D0248870523A82A8C2F6AEE40054E5D98C0334C41ACCF230D8CFC;  

    struct StakeInfo {
        uint96  amountStake;   							                // Enough for AKRE: 10**28 
        uint32  releaseTime;                                // Timestamp the stake can be released  
        uint32  nonce;
    }  

    struct Sig {
        uint8       v;
        bytes32     r;
        bytes32     s;              
    }

    struct OffsetAction {
        address   plugMiner;
        uint256   offsetAmount;
    }  

    struct OffsetActionBatch {
        address   plugMiner;
        address   owner;
        address   tokenPayment;
        uint256   offsetAmount;
        uint256   nonce;
    }  

    bytes32 public _DOMAIN_SEPARATOR;
    address public akreToken;
    address public kWhToken;
    address public manager;

    uint96 public totalStake;
    uint96 public totalOffset;

    // MSB0:12: Amount of stake, enough for 10**28 AKRE; MSB12:4: reserved; 
    // MSB16:8: Total Offset(kWh), MSB24:4: nonce; MSB28:4: stake release time;
    mapping(address => uint256) private stakerInfo;         // mapping from user address to stake info

    // MSB0:20: Owner address; MSB20:4: offset Counter; MSB24:8: Total Offset (Unit: kWh);
    mapping(address => uint256) public minerOffsetInfo;   // mapping from plug miner address to offset info

    // mapping from user address to deposit token to deposit amount
    mapping(address => mapping(address => uint256)) public depositAmounts;

    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, "Deadline Expired!");
        _;
    }

    event Offset(address indexed txid, address indexed greener, OffsetAction[] offsetActions, address tokenToPay, uint256 stakeAmount, uint256 offsetBaseIndex, uint256 nonce);
    event Stake(address indexed txid, address indexed staker, address plugMiner, uint256 amount, uint256 period, uint256 nonce);
    event Unstake(address indexed txid, address indexed staker, address plugMiner, uint256 amount, uint256 nonce);
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);
    event OffsetServer(address indexed txid, uint256 offsetBaseIndex, uint256 totalOffsetAmount, OffsetActionBatch[] offsetActionBatch);

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
                keccak256(bytes("Green Power")),
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

    /**
     * @dev Approve the tokens which can be transferred to kWhContract from kWh converting.
     * @param tokens The token list
     */
    function approveConvertkWh(address[] calldata tokens) public onlyOwner {
        require (kWhToken != address(0), "Zero kWh");
        for (uint256 i = 0; i < tokens.length; i++) {
            TransferHelper.safeApprove(tokens[i], kWhToken, type(uint256).max);
        }
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

        uint256 totalOffsetAmount = 0;
        for (uint256 index; index < offsetActions.length; index++) {
            address plugMiner = offsetActions[index].plugMiner;
            if (minerOffsetInfo[plugMiner] == 0) {
                minerOffsetInfo[plugMiner] = (uint256(uint160(msg.sender)) << 96);          // set owner once the first time offseting
            } else {
                require (msg.sender == address(uint160(minerOffsetInfo[plugMiner] >> 96)), "Wrong Owner");
            }

            uint256 offsetAmount = offsetActions[index].offsetAmount;
            require ((offsetAmount >= (10**6)) && ((offsetAmount % (10**6)) == 0), "Wrong Offset Amount");
            
            // Total Offset Counter, 4 Bytes; Total Offset Amount: 8 Bytes, ~1.8 * (10**19) kWh; Assuming never overflow;
            minerOffsetInfo[plugMiner] += (1 << 64) + uint64(offsetAmount);
            totalOffsetAmount += offsetAmount;
        }
       
        {
            //function convertKWh(address tokenToPay, uint256 amountPayment)
            uint256 price = IkWhToken(kWhToken).priceForSwap(tokenToPay);
            uint256 amountPayment = totalOffsetAmount * price / (10**6);
            require(IERC20Upgradeable(tokenToPay).transferFrom(msg.sender, address(this), amountPayment));
            
            uint256 amountToBurn = IkWhToken(kWhToken).convertKWh(tokenToPay, amountPayment);
            require (totalOffsetAmount == amountToBurn);

            IkWhToken(kWhToken).burn(amountToBurn);
        }

        uint256 offsetBaseIndex = totalOffset / (10**6);
        totalOffset += uint96(totalOffsetAmount);

        emit Offset(txid, msg.sender, offsetActions, tokenToPay, (stakerInfo[msg.sender]>>160), offsetBaseIndex, nonce);
    }

    enum SkipReason {
        NORMAL,
        WRONG_OWNER,
        WRONG_AMOUNT,
        LESS_DEPOSIT
    }

    function offsetPowerServer(
            address txid,
            OffsetActionBatch[] memory offsetActionBatch
        ) external nonReentrant onlyManager
    {
        uint256 totalOffsetAmount = 0;
        uint256 skipReason;
        address tokenToPay;
        uint256 price;

        for (uint256 index; index < offsetActionBatch.length; (offsetActionBatch[index].nonce += (skipReason<<64), index++)) {
            skipReason = uint256(SkipReason.NORMAL);
            address plugMiner = offsetActionBatch[index].plugMiner;
            address owner = offsetActionBatch[index].owner;
            uint256 offsetInfo = minerOffsetInfo[plugMiner];

            if (offsetInfo != 0) {
                if(owner != address(uint160(offsetInfo >> 96))) {
                    skipReason = uint256(SkipReason.WRONG_OWNER);
                    continue; 
                }
            }

            uint256 offsetAmount = offsetActionBatch[index].offsetAmount;
            if (!((offsetAmount >= (10**6)) && ((offsetAmount % (10**6)) == 0))) {
                skipReason = uint256(SkipReason.WRONG_AMOUNT);
                continue; 
            }
      
            {
                //function convertKWh(address tokenToPay, uint256 amountPayment)
                address tokenToPayNew = offsetActionBatch[index].tokenPayment;
                if (tokenToPayNew != tokenToPay) {                                      // To avoid fetch price repeatly 
                    tokenToPay = tokenToPayNew;
                    price = IkWhToken(kWhToken).priceForSwap(tokenToPay);
                }
                uint256 amountPayment = offsetAmount * price / (10**6);                 // Assuming always divide exactly, shoud be the case

                if (depositAmounts[owner][tokenToPay] < amountPayment) {
                    skipReason = uint256(SkipReason.LESS_DEPOSIT);
                    continue; 
                }

                depositAmounts[owner][tokenToPay] -= amountPayment;
                uint256 amountToBurn = IkWhToken(kWhToken).convertKWh(tokenToPay, amountPayment);
                require (offsetAmount == amountToBurn);
                IkWhToken(kWhToken).burn(amountToBurn);
            }

            // Total Offset Counter, 4 Bytes; Total Offset Amount: 6 Bytes, ~2.8 * (10**14) kWh; Assuming never overflow;
            if (offsetInfo == 0) {
                minerOffsetInfo[plugMiner] = (uint256(uint160(owner)) << 96);           // set owner once the first time offseting
            }

            minerOffsetInfo[plugMiner] += (1 << 64) + uint64(offsetAmount);
            totalOffsetAmount += offsetAmount;
        }

        uint256 offsetBaseIndex = totalOffset / (10**6);
        totalOffset += uint96(totalOffsetAmount);

        emit OffsetServer(txid, offsetBaseIndex, totalOffsetAmount, offsetActionBatch);
    }

    function stake(address txid, address plugMiner, uint256 amount, uint256 period, uint256 nonce, uint256 deadline, Sig calldata signature) external nonReentrant ensure(deadline) {
        require (amount > 0, "Zero Stake"); 

        if (minerOffsetInfo[plugMiner] == 0) {
            minerOffsetInfo[plugMiner] = (uint256(uint160(msg.sender)) << 96);          // set owner once the first time staking
        } else {
            require (msg.sender == address(uint160(minerOffsetInfo[plugMiner] >> 96)), "Not Owner"); 
        }
        
        uint256 userStakeInfo = stakerInfo[msg.sender];
        require (nonce == uint32(userStakeInfo >> 32), "Nonce Not Match");                // Check nonce 
        require ((period % (30 * 3600 * 24)) == 0, "Wrong period");                       // 30, 60, 90, 180 days

        require ((block.timestamp + period) >= uint32(userStakeInfo), "Short Period");    // period must increase the release timestamp

        {
            bytes32 stakeHash = keccak256(abi.encode(STAKE_TYPEHASH, txid, msg.sender, plugMiner, amount, period, nonce, deadline));
            bytes32 digest = keccak256(abi.encodePacked('\x19\x01', _DOMAIN_SEPARATOR, stakeHash));
            address managerAddress = ECDSAUpgradeable.recover(digest, signature.v, signature.r, signature.s);
            require(managerAddress == manager, "Wrong Signature");
        }

        userStakeInfo = ((userStakeInfo >> 32) << 32) + uint32(block.timestamp + period);     // update release timestamp
        stakerInfo[msg.sender] = userStakeInfo + uint256(1 << 32) + uint256(amount << 160);   // increase nonce, and add stake amount

        totalStake = totalStake + uint96(amount);

        TransferHelper.safeTransferFrom(akreToken, msg.sender, address(this), amount);
        emit Stake(txid, msg.sender, plugMiner, amount, period, nonce);

    }

    function unstake(address txid, address plugMiner, uint256 amount, uint256 nonce, uint256 deadline, Sig calldata signature) external nonReentrant ensure(deadline){
        require (amount > 0, "Zero Stake"); 
        require (msg.sender == address(uint160(minerOffsetInfo[plugMiner] >> 96)), "Not Owner"); 

        uint256 userStakeInfo = stakerInfo[msg.sender];
        require (nonce == uint32(userStakeInfo >> 32), "Nonce Not Match"); 

        require(uint96(userStakeInfo >> 160) >= amount, "Unstake Overflowed");
        require (block.timestamp >= uint32(userStakeInfo), "Not Released");

        {
            bytes32 unstakeHash = keccak256(abi.encode(UNSTAKE_TYPEHASH, txid, msg.sender, plugMiner, amount, nonce, deadline));
            bytes32 digest = keccak256(abi.encodePacked('\x19\x01', _DOMAIN_SEPARATOR, unstakeHash));
            address managerAddress = ECDSAUpgradeable.recover(digest, signature.v, signature.r, signature.s);
            require(managerAddress == manager, "Wrong Signature");
        }

        userStakeInfo += (1<<32);                                                       // nonce + 1
        userStakeInfo -= (amount << 160);                                               // update the amount of stake
        if ((userStakeInfo >> 96) == 0) userStakeInfo = (userStakeInfo >> 32) << 32;    // clear release time if there is no stake
        stakerInfo[msg.sender] = userStakeInfo;                                          // save new stake info

        totalStake = totalStake - uint96(amount);

        TransferHelper.safeTransfer(akreToken, msg.sender, amount);
        emit Unstake(txid, msg.sender, plugMiner, amount, nonce);
    }

    function deposit(address token, uint256 amount) external {
        require (amount > 0, "Zero Amount"); 
        TransferHelper.safeTransferFrom(token, msg.sender, address(this), amount);
        depositAmounts[msg.sender][token] += amount;
        emit Deposit(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) external {
        require (amount > 0, "Zero Amount"); 
        depositAmounts[msg.sender][token] -= amount;
        TransferHelper.safeTransfer(token, msg.sender, amount);
        emit Withdraw(msg.sender, token, amount);
    }

    function getStakerInfo(address staker) external view 
        returns (uint256 stakeAmount, uint256 offsetAmount, uint256 nonce, uint256 releaseTime) 
    {
        uint256 userStakeInfo = stakerInfo[staker];
        releaseTime = uint256(uint32(userStakeInfo));
        nonce = uint256(uint32(userStakeInfo >> 32));
        offsetAmount = uint256(uint64(userStakeInfo >> 64));
        stakeAmount = uint256(uint96(userStakeInfo >> 160));
    }

    function getMinerOffsetInfo(address plugMiner) external view 
        returns (address owner, uint256 offsetCounter, uint256 offsetAmount) 
    {
        uint256 offsetInfo = minerOffsetInfo[plugMiner];
        owner = address(uint160(offsetInfo >> 96));
        offsetCounter = uint256(uint32(offsetInfo >> 64));
        offsetAmount = uint256(uint64(offsetInfo));
    }
}