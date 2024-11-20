// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";


import "../libraries/TransferHelper.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IERC20Permit.sol";

contract RWAsset is 
    OwnableUpgradeable,
    UUPSUpgradeable
{

    enum OrderStatus {
      Unused,               // 0
      Deposited,            // 1
      Withdrawed,           // 2
      Delivered,            // 3
      Onboarded,            // 4
      Cleared,              // 5
      Completed             // 6
    }

    enum InvestStatus {
      Unused,               // 0
      InvestNormal,         // 1
      InvestAborted,        // 2
      InvestCleared,        // 3
      InvestCompleted       // 4
    }

    struct AssetType {
        uint16    typeAsset;                  // asset type of specific device asset
        uint16    tenure;                     // asset funding effective duration in days
        uint16    remoteQuota;                // number of the remote sub-assets linked to one asset
        uint16    investQuota;                // quota of the fixed-gain investment unit
        uint32    valuePerInvest;             // price per investing unit in USDC/USDT
        uint48    amountRepayMonthly;         // amount in USDC/USDT needed to repay monthly to this contract
        uint32    amountGainPerInvest;        // amount in USDC/USDT repaid to the investers per investing unit
        uint32    amountDeposit;              // amount of AKRE to deposit, in unit of 10**18, subject to change 
        uint16    numSoldAssets;              // Number of assess of this asset type that have been sold
        uint32    investTokenList;            // token id list accepted for investing, maximum 4 tokens, should be stable coin
        uint8     maxInvestOverdue;           // Max days after date the asset is onboared when the investing is still acceppted  
        uint8     minInvestExit;              // Minimum days before the investing can exit  

    }

    struct GlobalStatus {
        uint16  numAssetType;               // Number of the asset type that have been defined
        uint32  numAssets;                  // Total number of assets that has been ordered, or deposited for order
        uint32  numCancelled;               // Total number of orders that has been cancelled
        uint32  numDelivered;               // Total number of assets that has been delivered
        uint32  numOnboarded;               // Total number of assets that has been onboarded
        uint16  numTokenAdded;              // Total number of tokens that have been added to the acception list
    }

    struct AssetStatus {
        uint16  typeID;                     // type number of the asset
        uint16  remoteSubSold;
        uint32  investSold;
    }

    struct AssetInfo {
        address         assetOwner;               // Address of user ordering the asset
        OrderStatus     status;
        uint16          typeAsset;                // type number of the asset
        uint16          numInvestings;            // number of investing transactions 
        uint16          numQuotaTotal;            // total number of quota that have been invested
        uint32          amountDeposit;            // amount of AKRE that has been deposited bu the owner, in unit of 10**18 
        uint32          deliverProofId;           // proof id delivering the asset
        uint32          onboardTimestamp;         // onboarding timestamp of the asset
    }

    struct Invest {
        address         invester;                 // Address of the invester
        uint8           status;                   // invest Status
        uint16          tokenId;                  // paymeny tokne Id
        uint16          numQuota;                 // number of quota invested
        uint32          timestamp;                // the timestamp investing
    }

    struct Sig {
        uint8       v;
        bytes32     r;
        bytes32     s;              
    }

    // Constants
    // keccak256("WithdrawDeposit(uint256 assetId,address owner,uint256 amount,uint256 deadline)");
    bytes32 public constant WITHDRAW_DEPOSIT_TYPEHASH = 0x13A85DF7BA3E360145D037DDF19961B9D6DD67577B03674D20BBB74BA15C259E;  

    // Public variables
    bytes32 public DOMAIN_SEPARATOR;
    address public tokenAKRE;                           // Token adddress of AKRE
    address public assetAuthority;                      // The entity doing authorization
    address public assetManager;                        // The enity managing the asset operating process on blockchain        

    GlobalStatus public globalStatus;                           // Global asset status
    mapping(uint256 => AssetType) public assetTypes;            // All asset type that have been defined,  type -> type info
    mapping(address => AssetStatus) public userInfo;            // user information, user address -> user info
    mapping(uint32 => AssetInfo) public assetList;              // All asset list, asset id -> asset info
    mapping(address => uint32[]) public userOrderList;          // user order list, user -> order list, assuming the list is not long
    mapping(uint256 => bytes32) public deliveryProofList;       // all delivery proof list, proof id -> delivery proof 

    mapping(uint16 => address) public allInvestTokens;          // all tokens accepted for investing

    mapping(address => uint48[]) public userInvestList;         // user invest list, user -> investing index list, assuming the list is not long

    // investing index = (asset id (4Bytes B28-B30) || investing serial number (2 Bytes, B31-B32)) 
    // mapping (investing index) -> investList
    mapping(uint256 => Invest) public investList;

    // Events
    event AddNewInvestToken(address[] tokens);
    event DepositForAsset(address indexed user, uint256 typeAsset, uint256 amountDeposit);
    event AddNewAssetType(AssetType newAssetType);
    event WithdrawDeposit(address indexed user, uint256 assetId, uint256 amount);
    event DeliverAsset(uint256 assetId, bytes32 proof);
    event OnboardAsset(uint256 assetId);
    event InvestAsset(address indexed user, uint256 assetId, uint256 tokenId, uint256 amountQuota);
    event InvestExit(address indexed user, uint256 investIndex, address tokenInvest, uint256 amountToken);

    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, "RWA: EXPIRED");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == assetManager, "RWA: Not manager");
        _;
    }   

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _tokenAKRE, address _assetAuthority, address _assetManager)
        external
        virtual
        initializer
    {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();
        tokenAKRE = _tokenAKRE;
        assetAuthority = _assetAuthority;
        assetManager = _assetManager;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Arkreen RWA Fund")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );  
    }

    function postUpdate() external onlyProxy onlyOwner 
    {}

    function _authorizeUpgrade(address newImplementation)
        internal
        virtual
        override
        onlyOwner
    {}

    /**
     * @dev Add new accepted investment tokens
     * @param newTokens new token list. should avoid repeation, which is not checked.
     */
    function addNewInvestToken(
        address[] memory newTokens
    ) external onlyManager {

        uint16 numTokenAdded = globalStatus.numTokenAdded;
        for (uint256 index = 0; index < newTokens.length; index++) {
            allInvestTokens[++numTokenAdded] = newTokens[index];
        }
        globalStatus.numTokenAdded = numTokenAdded;

        emit AddNewInvestToken(newTokens);
    }

    /**
     * @dev Define a new asset type 
     * @param newAssetType add a new asset type
     */
    function addNewAssetType(
        AssetType memory newAssetType
    ) external onlyManager {
        globalStatus.numAssetType += 1;
        require(globalStatus.numAssetType == newAssetType.typeAsset,  "RWA: Wrong asset type");
        assetTypes[newAssetType.typeAsset] = newAssetType;
        emit AddNewAssetType(newAssetType);
    }

    function depositForAsset (uint256 typeAsset) external {

        require (assetTypes[typeAsset].typeAsset != 0, "RWA: Asset type not defined");

        // Generate the new order id
        uint32 assetId = globalStatus.numAssets + 1;
        globalStatus.numAssets = assetId;

        // Save new order info
        assetList[assetId].assetOwner = msg.sender;
        assetList[assetId].typeAsset = uint16(typeAsset);
        assetList[assetId].amountDeposit = assetTypes[typeAsset].amountDeposit;
        assetList[assetId].status = OrderStatus.Deposited;

        // append to user order list
        userOrderList[msg.sender].push(assetId);

        // Transfer deposit AKRE
        uint256 amountDepositAKRE = uint256(assetTypes[typeAsset].amountDeposit) * (1 ether);
        TransferHelper.safeTransferFrom(tokenAKRE, msg.sender, address(this), amountDepositAKRE);

        emit DepositForAsset(msg.sender, typeAsset, amountDepositAKRE);
    }

    function withdrawDeposit(
        uint256 assetId,
        uint256 deadline,
        Sig memory withdrawPermit
    ) external ensure(deadline) {

        require (assetList[uint32(assetId)].assetOwner == msg.sender, "RWA: Not Owner");
        require (assetList[uint32(assetId)].status == OrderStatus.Deposited, "RWA: Not allowed");

        uint256 amountDeposit = uint256(assetList[uint32(assetId)].amountDeposit) * (1 ether); 

        // Check signature
        // keccak256("WithdrawDeposit(uint256 assetId,address owner,uint256 amount,uint256 deadline)");
        bytes32 hashRegister = keccak256(abi.encode(WITHDRAW_DEPOSIT_TYPEHASH, 
                                                      assetId, msg.sender, amountDeposit, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hashRegister));
        address authorityAddress = ECDSAUpgradeable.recover(digest, withdrawPermit.v, withdrawPermit.r, withdrawPermit.s);
        require(authorityAddress == assetAuthority, "RWA: Wrong Signature");
  
        assetList[uint32(assetId)].status = OrderStatus.Withdrawed;
        TransferHelper.safeTransfer(tokenAKRE, msg.sender, amountDeposit);
        emit WithdrawDeposit(msg.sender, assetId, amountDeposit);
    }

    /**
     * @dev Declare the asset has been delivered 
     * @param assetId the order id that has been delivered
     * @param deliveryProof the proof info proving the delivery, which may be the hash of all delivery information.
     */
    function deliverAsset(
        uint256 assetId,
        bytes32 deliveryProof
    ) external onlyManager {

        require (assetList[uint32(assetId)].status == OrderStatus.Deposited, "RWA: Not allowed");
        assetList[uint32(assetId)].status = OrderStatus.Delivered;

        uint32 numDelivered = globalStatus.numDelivered + 1;
        globalStatus.numDelivered = numDelivered;
        assetList[uint32(assetId)].deliverProofId = numDelivered;

        deliveryProofList[numDelivered] = deliveryProof;

        emit DeliverAsset(assetId, deliveryProof);
    }

    /**
     * @dev Onboarding the asset
     * @param assetId the order id that has been onboarded
     */
    function onboardAsset(
        uint256 assetId
    ) external onlyManager {

        require (assetList[uint32(assetId)].status == OrderStatus.Delivered, "RWA: Not allowed");
        assetList[uint32(assetId)].status = OrderStatus.Onboarded;

        globalStatus.numOnboarded += 1;
        assetList[uint32(assetId)].onboardTimestamp = uint32(block.timestamp);

        emit OnboardAsset(assetId);
    }


    /**
     * @dev Investing the asset
     * @param assetId the order id that has been onboarded
     * @param tokenId the token address to invest, starting from 1
     * @param numQuota number of quota to invest
     */
    function investAsset(
        uint256 assetId,
        uint256 tokenId,
        uint256 numQuota
    ) external {

        OrderStatus statusAsset = assetList[uint32(assetId)].status;
        require ((statusAsset >= OrderStatus.Delivered) && (statusAsset < OrderStatus.Cleared), "RWA: Status not allowed");

        uint16 typeAsset = assetList[uint32(assetId)].typeAsset;

        if (statusAsset == OrderStatus.Onboarded) {
            uint32 onboardTimestamp = assetList[uint32(assetId)].onboardTimestamp;
            uint32 overdueTime = onboardTimestamp + uint32(assetTypes[typeAsset].maxInvestOverdue) * 3600 * 24;
            require ( overdueTime > uint32(block.timestamp), "RWA: Invest overdued");
        }

        uint16 numQuotaTotal = assetList[uint32(assetId)].numQuotaTotal +  uint16(numQuota);   
        require (numQuotaTotal <= assetTypes[typeAsset].investQuota, "RWA: Invest overflowed");
        assetList[uint32(assetId)].numQuotaTotal = numQuotaTotal;

        uint16 numInvestings = assetList[uint32(assetId)].numInvestings + 1;
        assetList[uint32(assetId)].numInvestings = numInvestings;

        uint48 indexInvesting = uint48(assetId << 16) + numInvestings; 

        userInvestList[msg.sender].push(indexInvesting);

        investList[indexInvesting].invester = msg.sender;
        investList[indexInvesting].status = uint8(InvestStatus.InvestNormal);
        investList[indexInvesting].tokenId = uint16(tokenId);
        investList[indexInvesting].numQuota = uint16(numQuota);
        investList[indexInvesting].timestamp = uint32(block.timestamp);

        uint256 amountToken = numQuota * assetTypes[typeAsset].valuePerInvest;
        address tokenInvest = allInvestTokens[uint16(tokenId)];

        TransferHelper.safeTransferFrom(tokenInvest, msg.sender, address(this), amountToken);

        emit InvestAsset(msg.sender, assetId, tokenId, numQuota);
    }


    /**
     * @dev Exit the asset investment before onboarding
     * @param investIndex the index of the asset investment
     */
    function investExit(
        uint256 investIndex
    ) external {

        Invest memory investToAbort = investList[uint48(investIndex)];

        require (investToAbort.invester == msg.sender, "RWA: Not owner");
        require (investToAbort.status == uint8(InvestStatus.InvestNormal), "RWA: Wrong status");
        require (uint32(block.timestamp) > (investToAbort.timestamp +  7 * 24 *3600) , "RWA: Need to stay");

        investToAbort.status = uint8(InvestStatus.InvestAborted);

        uint32 assetId = uint32(investIndex >> 16);
        uint16 typeAsset = assetList[assetId].typeAsset;

        assetList[assetId].numQuotaTotal -= investToAbort.numQuota;

        uint256 amountToken = investToAbort.numQuota * assetTypes[typeAsset].valuePerInvest;
        address tokenInvest = allInvestTokens[uint16(investToAbort.tokenId)];

        TransferHelper.safeTransferFrom(tokenInvest, msg.sender, address(this), amountToken);

        emit InvestExit(msg.sender, investIndex, tokenInvest, amountToken);
    }

}
