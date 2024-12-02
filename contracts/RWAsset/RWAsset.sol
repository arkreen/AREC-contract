// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "../libraries/TransferHelper.sol";
import "../libraries/DateTime.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IERC20Permit.sol";

contract RWAsset is 
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{

    enum AssetStatus {
      Unused,               // 0
      Deposited,            // 1
      Withdrawed,           // 2
      Delivered,            // 3
      Onboarded,            // 4
      Clearing,             // 5
      Cleared,              // 6
      Completed             // 7
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
        uint32    amountYieldPerInvest;       // amount of the yield in USDC/USDT paid to the investers per investing unit
        uint32    amountDeposit;              // amount of AKRE to deposit, in unit of 10**18, subject to change; subject to change. 
        uint16    numSoldAssets;              // Number of assess of this asset type that have been sold
        uint8     investTokenType;            // token type accepted for the investing, should be stable coin; =1 USD, =2, EURO
        uint8     maxInvestOverdue;           // Max days after date the asset is onboared when the investing is still acceppted  
        uint8     minInvestExit;              // Minimum days before the investing can exit  
        uint8     interestId;                 // id of the interest rate
        // Full
    }


    struct GlobalStatus {
        uint16  numAssetType;               // Number of the asset type that have been defined
        uint32  numAssets;                  // Total number of assets that has been setup by depositing
        uint32  numCancelled;               // Total number of assets whose deposit that has been cancelled
        uint32  numDelivered;               // Total number of assets that has been delivered
        uint32  numOnboarded;               // Total number of assets that has been onboarded
        uint16  numTokenAdded;              // Total number of tokens that have been added to the allowed token list
        uint32  numInvest;                  // Total number of investing transactions
    }

//    struct AssetStatus {
//        uint16  typeID;                     // type number of the asset
//        uint16  remoteSubSold;
//        uint32  investSold;
//    }

    struct AssetDetails {
        address         assetOwner;               // Address of user owning the asset
        AssetStatus     status;
        uint16          tokenId;
        uint16          typeAsset;                // type number of the asset
        uint16          numInvestings;            // number of investing transactions 
        uint16          numQuotaTotal;            // total number of quota that have been invested
        uint32          amountDeposit;            // amount of AKRE that has been deposited by the owner, in unit of 10**18 
        uint32          deliverProofId;           // proof id delivering the asset
        uint32          onboardTimestamp;         // onboarding timestamp of the asset
        uint48          sumAmountRepaid;          // sum of the amount repaid to the contract
        uint48          amountForInvestWithdarw;  // amount available for invest withdraw  
        uint48          amountInvestWithdarwed;   // amount withdrawed by investing
    }

    struct RepayDetails {
        uint8           nextDueMonth;             // the next month id to repay the due
        uint32          timestampNextDue;         // the timestamp of to repay the next due monthly
        uint48          amountRepayDue;           // amount to repay on the due timestamp
        uint48          amountDebt;               // amount of the debt of asset owner
        uint32          timestampDebt;            // timestamp of the debt starting         
        uint48          amountDebtRepaid;         // the amount of the debt that are repaid and can be claimed
        uint48          amountRepayReady;         // the amount ready to repay the due monthly
        uint48          amountPrePay;             // the amount of Pre-Pay for next months
        uint48          amountRepayTaken;         // the amount of monthly repayment tha has been taken
    }

    struct ClearanceDetails {
        uint80          amountTrigerClearance;    // threshold triggering clearance
        uint80          amountDebtOverdueProduct; // sum of the product of debt and overdue duration
    }

    struct Invest {
        address         invester;                 // Address of the invester
        uint32          assetId;                  // id of the investing asset 
        uint32          timestamp;                // the timestamp investing
        uint8           status;                   // invest Status
        uint16          numQuota;                 // number of quota invested
        uint8           monthTaken;               // the last month the yeild has been taken
    }

    struct InvestToken {
        uint8           tokenType;                    // type of the stabel coin, = 1, USD, =2 EURO
        address         tokenAddress;                    // Address of the token erc20
    }

    struct InterestRate {
        uint96          ratePerSecond;                // Interest rate per second, on the base of (10^27)
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
    address public fundReceiver;                        // The enity address receiving the asset repayment monthly

    GlobalStatus public globalStatus;                           // Global asset status
    mapping(uint16 => AssetType) public assetTypes;             // All asset type that have been defined,  type -> type info
    mapping(address => AssetStatus) public userInfo;            // user information, user address -> user info
    mapping(uint32 => AssetDetails) public assetList;           // All asset list, asset id -> asset details
    mapping(uint32 => RepayDetails) public assetRepayStatus;    // All asset repaymnet status, asset id -> asset details
    mapping(uint32 => ClearanceDetails) public assetClearance;  // All asset clearance information, asset id -> asset clearance information

    mapping(address => uint32[]) public userAssetList;          // user asset list, user -> asset list, assuming the list is not long
    mapping(uint256 => bytes32) public deliveryProofList;       // all delivery proof list, proof id -> delivery proof 

    mapping(uint16 => InvestToken) public allInvestTokens;      // all tokens accepted for investing
    mapping(uint8 => InterestRate) public allInterestRates;    // all interest rates

    mapping(address => uint48[]) public userInvestList;         // user invest list, user -> investing index list, assuming the list is not long

    // investing index = (asset id (4Bytes B28-B30) || investing serial number (2 Bytes, B31-B32)) 
    // mapping (investing index) -> investList
    mapping(uint256 => Invest) public investList;

    // Events
    event AddNewInvestToken(uint8 tokenType, address[] tokens);
    event DepositForAsset(address indexed user, uint256 typeAsset, uint256 tokenId, uint256 assetId, uint256 amountDeposit);
    event AddNewAssetType(AssetType newAssetType);
    event WithdrawDeposit(address indexed user, uint256 assetId, uint256 amount);
    event DeliverAsset(uint256 assetId, bytes32 proof);
    event OnboardAsset(uint256 assetId);
    event InvestAsset(address indexed user, uint256 assetId, address token, uint256 amount);
    event InvestExit(address indexed user, uint256 investIndex, address tokenInvest, uint256 amountToken);
    event RepayMonthly(address indexed user, uint256 assetId, address tokenInvest, uint256 amountToken);
    event InvestTakeYield(address indexed user, uint256 investIndex, uint256 months, address tokenInvest, uint256 amountToken); 
    event TakeRepayment(uint256 assetId, address tokenInvest, uint256 amountToken); 

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
     * @dev Set the asset manager
     */
    function setAssetManager(address manager) external onlyOwner {
        require (manager != address(0), "RWA: Zero address");
        assetManager = manager;
    }

    function setFundReceiver(address receiver) external onlyOwner {
        require (receiver != address(0), "RWA: Zero address");
        fundReceiver = receiver;
    }

    /**
     * @dev Add new accepted investment tokens
     * @param tokenType type of the tokens.
     * @param newTokens new token list. should avoid repeation, which is not checked.
     */
    function addNewInvestToken(
        uint8 tokenType,
        address[] memory newTokens
    ) external onlyManager {

        uint16 numTokenAdded = globalStatus.numTokenAdded;
        for (uint256 index = 0; index < newTokens.length; index++) {
            numTokenAdded += 1;
            allInvestTokens[numTokenAdded].tokenType = tokenType;
            allInvestTokens[numTokenAdded].tokenAddress = newTokens[index];

        }
        globalStatus.numTokenAdded = numTokenAdded;

        emit AddNewInvestToken(tokenType, newTokens);
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

    function depositForAsset (uint16 typeAsset, uint16 tokenId) external {

        require (assetTypes[typeAsset].typeAsset != 0, "RWA: Asset type not defined");
        require (assetTypes[typeAsset].investTokenType == allInvestTokens[tokenId].tokenType, "RWA: Wrong token");

        // Generate the new asset id
        uint32 assetId = globalStatus.numAssets + 1;
        globalStatus.numAssets = assetId;

        // Save new asset info
        assetList[assetId].assetOwner = msg.sender;
        assetList[assetId].tokenId = tokenId;
        assetList[assetId].typeAsset = typeAsset;
        assetList[assetId].amountDeposit = assetTypes[typeAsset].amountDeposit;   // depost amount may be modified for asset type
        assetList[assetId].status = AssetStatus.Deposited;

        // append to user asset list
        userAssetList[msg.sender].push(assetId);

        // Transfer deposit AKRE
        uint256 amountDepositAKRE = uint256(assetTypes[typeAsset].amountDeposit) * (1 ether);
        TransferHelper.safeTransferFrom(tokenAKRE, msg.sender, address(this), amountDepositAKRE);

        emit DepositForAsset(msg.sender, typeAsset, tokenId, assetId, amountDepositAKRE);
    }

    function withdrawDeposit(
        uint32 assetId,
        uint256 deadline,
        Sig memory withdrawPermit
    ) external ensure(deadline) {

        require (assetList[assetId].assetOwner == msg.sender, "RWA: Not Owner");
        require (assetList[assetId].status == AssetStatus.Deposited, "RWA: Not allowed");

        uint256 amountDeposit = uint256(assetList[assetId].amountDeposit) * (1 ether); 

        // Check signature
        // keccak256("WithdrawDeposit(uint32 assetId,address owner,uint256 amount,uint256 deadline)");
        bytes32 hashRegister = keccak256(abi.encode(WITHDRAW_DEPOSIT_TYPEHASH, 
                                                      assetId, msg.sender, amountDeposit, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hashRegister));
        address authorityAddress = ECDSAUpgradeable.recover(digest, withdrawPermit.v, withdrawPermit.r, withdrawPermit.s);
        require(authorityAddress == assetAuthority, "RWA: Wrong Signature");
  
        assetList[assetId].status = AssetStatus.Withdrawed;
        TransferHelper.safeTransfer(tokenAKRE, msg.sender, amountDeposit);
        emit WithdrawDeposit(msg.sender, assetId, amountDeposit);
    }

    /**
     * @dev Declare the asset has been delivered 
     * @param assetId the asset id that has been delivered
     * @param deliveryProof the proof info proving the delivery, which may be the hash of all delivery information.
     */
    function deliverAsset(
        uint256 assetId,
        bytes32 deliveryProof
    ) external onlyManager {

        require (assetList[uint32(assetId)].status == AssetStatus.Deposited, "RWA: Not allowed");
        assetList[uint32(assetId)].status = AssetStatus.Delivered;

        uint32 numDelivered = globalStatus.numDelivered + 1;
        globalStatus.numDelivered = numDelivered;
        assetList[uint32(assetId)].deliverProofId = numDelivered;

        deliveryProofList[numDelivered] = deliveryProof;

        emit DeliverAsset(assetId, deliveryProof);
    }

    /**
     * @dev Onboarding the asset
     * @param assetId the asset id that has been onboarded
     */
    function onboardAsset(
        uint32 assetId
    ) external onlyManager {

        require (assetList[assetId].status == AssetStatus.Delivered, "RWA: Not allowed");
        assetList[assetId].status = AssetStatus.Onboarded;

        globalStatus.numOnboarded += 1;
        assetList[assetId].onboardTimestamp = uint32(block.timestamp);

        uint16 typeAsset = assetList[assetId].typeAsset;

        assetRepayStatus[assetId].nextDueMonth = 1; 
        assetRepayStatus[assetId].timestampNextDue = uint32(DateTime.addMonthsEnd(block.timestamp, 1));
        assetRepayStatus[assetId].amountRepayDue = assetTypes[typeAsset].amountRepayMonthly;
        
        emit OnboardAsset(assetId);
    }


    /**
     * @dev Investing the asset
     * @param assetId the asset id that has been onboarded
     * @param numQuota number of quota to invest
     */
    function investAsset(
        uint32 assetId,
        uint16 numQuota
    ) external {

        AssetStatus statusAsset = assetList[assetId].status;
        require ((statusAsset >= AssetStatus.Delivered) && (statusAsset < AssetStatus.Cleared), "RWA: Status not allowed");

        uint16 typeAsset = assetList[assetId].typeAsset;

        if (statusAsset == AssetStatus.Onboarded) {
            uint32 onboardTimestamp = assetList[assetId].onboardTimestamp;
            uint32 overdueTime = onboardTimestamp + uint32(assetTypes[typeAsset].maxInvestOverdue) * 3600 * 24;
            require (uint32(block.timestamp) < overdueTime, "RWA: Invest overdued");
        }

        uint16 numQuotaTotal = assetList[assetId].numQuotaTotal + numQuota;   
        require (numQuotaTotal <= assetTypes[typeAsset].investQuota, "RWA: Invest overflowed");
        assetList[assetId].numQuotaTotal = numQuotaTotal;

        uint16 numInvestings = assetList[assetId].numInvestings + 1;
        assetList[assetId].numInvestings = numInvestings;

        uint48 indexInvesting = uint48(assetId << 16) + numInvestings; 

        userInvestList[msg.sender].push(indexInvesting);

        investList[indexInvesting].invester = msg.sender;
        investList[indexInvesting].status = uint8(InvestStatus.InvestNormal);
        investList[indexInvesting].assetId = assetId;
        investList[indexInvesting].numQuota = numQuota;
        investList[indexInvesting].timestamp = uint32(block.timestamp);

        globalStatus.numInvest += 1;

        uint256 amountToken = uint256(numQuota) * uint256(assetTypes[typeAsset].valuePerInvest);
        address tokenInvest = allInvestTokens[assetList[assetId].tokenId].tokenAddress;
        TransferHelper.safeTransferFrom(tokenInvest, msg.sender, address(this), amountToken);

        emit InvestAsset(msg.sender, assetId, tokenInvest, amountToken);
    }


    /**
     * @dev Exit the asset investment before onboarding
     * @param investIndex the index of the asset investment
     */
    function investExit(
        uint48 investIndex
    ) external {

        Invest memory investToAbort = investList[investIndex];

        require (investToAbort.invester == msg.sender, "RWA: Not owner");
        require (investToAbort.status == uint8(InvestStatus.InvestNormal), "RWA: Wrong status");

        uint32 assetId = uint32(investIndex >> 16);
        uint16 typeAsset = assetList[assetId].typeAsset;

        AssetStatus statusAsset = assetList[assetId].status;
        require ((statusAsset <= AssetStatus.Delivered) , "RWA: Status not allowed");   // Not allowed after onboarding

        uint32 minStay = investToAbort.timestamp + uint32(assetTypes[typeAsset].minInvestExit) * 3600 * 24;
        require (uint32(block.timestamp) >= minStay, "RWA: Need to stay");

        investList[investIndex].status = uint8(InvestStatus.InvestAborted);
        assetList[assetId].numQuotaTotal -= investToAbort.numQuota;

        uint256 amountToken = uint256(investToAbort.numQuota) * uint256(assetTypes[typeAsset].valuePerInvest);
        address tokenInvest = allInvestTokens[assetList[assetId].tokenId].tokenAddress;

        TransferHelper.safeTransfer(tokenInvest, msg.sender, amountToken);

        emit InvestExit(msg.sender, investIndex, tokenInvest, amountToken);
    }
   
    /**
     * @dev Exit the asset investment before onboarding
     * @param assetId the index of the asset investment
     * @param timeToPay the index of the asset investment     
     */
    function queryRepay(
        uint32 assetId,
        uint32 timeToPay
    ) external pure returns (uint256, uint256) {

    //        AssetStatus statusAsset = assetList[assetId].status;
    //        require (statusAsset == AssetStatus.Onboarded, "RWA: Status not allowed");

    //        assetList[assetId].sumAmountRepaid += 

         
    
        // 1704067200: 2024/01/01
      return (assetId, timeToPay);

    }

    function checkRepayMonthly (uint32 assetId) internal returns (uint256 interestRate) {
        RepayDetails storage assetRepayStatusRef = assetRepayStatus[assetId];
        AssetDetails storage assetStatuseRef = assetList[assetId];
        ClearanceDetails storage assetClearanceRef = assetClearance[assetId];

        uint16 typeAsset = assetList[assetId].typeAsset;
        interestRate = allInterestRates[assetTypes[typeAsset].interestId].ratePerSecond;

        if (uint32(block.timestamp) > assetRepayStatusRef.timestampNextDue) {
            uint48 debtWithInterest = 0;
            if (assetRepayStatusRef.amountDebt != 0) {
                uint256 debtDuration = assetRepayStatusRef.timestampNextDue - assetRepayStatusRef.timestampDebt;
                debtWithInterest = uint48(rpow(interestRate, debtDuration) * uint256(assetRepayStatusRef.amountDebt) / (10 ** 27));
                assetClearanceRef.amountDebtOverdueProduct += uint80(debtDuration * assetRepayStatusRef.amountDebt);
            }

            assetRepayStatusRef.amountDebt = debtWithInterest + assetRepayStatusRef.amountRepayDue;
            assetRepayStatusRef.timestampDebt = assetRepayStatusRef.timestampNextDue;

            assetRepayStatusRef.amountRepayDue = assetTypes[assetStatuseRef.typeAsset].amountRepayMonthly;
            uint8 nextMonth = assetRepayStatusRef.nextDueMonth + 1;
            assetRepayStatusRef.nextDueMonth = nextMonth;
            assetRepayStatusRef.timestampNextDue = uint32(DateTime.addMonthsEnd(assetStatuseRef.onboardTimestamp, nextMonth));
        }
        
        // Check if need to clear the asset
        // To do
        if (assetRepayStatusRef.amountDebt != 0) {
            uint256 debtDuration = uint32(block.timestamp) - assetRepayStatusRef.timestampDebt;
            uint256 amountDebtOverdueProduct = assetClearanceRef.amountDebtOverdueProduct;
            amountDebtOverdueProduct += uint80(debtDuration * assetRepayStatusRef.amountDebt);
            if (amountDebtOverdueProduct >= assetClearanceRef.amountTrigerClearance) {
              assetStatuseRef.status = AssetStatus.Clearing;
            }
        }
    }

    /**
     * @dev Repay the asset installment monthly
     * @param assetId index of the asset investment
     * @param amountToken amount of the repay
     */
    function repayMonthly(
        uint32 assetId,
        uint48 amountToken
    ) external nonReentrant {

        AssetDetails storage assetStatuseRef = assetList[assetId];
        require (assetStatuseRef.status == AssetStatus.Onboarded, "RWA: Status not allowed");

        uint256 interestRate = checkRepayMonthly(assetId);

        // Transfer repay token
        address tokenInvest = allInvestTokens[assetStatuseRef.tokenId].tokenAddress;
        TransferHelper.safeTransferFrom(tokenInvest, msg.sender, address(this), amountToken);

        assetStatuseRef.sumAmountRepaid += amountToken;
        uint48 amountTokenNet = amountToken;

        RepayDetails storage assetRepayStatusRef = assetRepayStatus[assetId];

        // Check if there is debt pending
        if (assetRepayStatusRef.amountDebt != 0) {
            uint256 debtDuration = block.timestamp - assetRepayStatusRef.timestampDebt;
            uint48 debtWithInterest = uint48(rpow(interestRate, debtDuration) * uint256(assetRepayStatusRef.amountDebt) / (10 ** 27));

            if (amountTokenNet >= debtWithInterest) {
                // amount of the repay is enough to pay back the debt
                assetRepayStatusRef.amountDebt = 0;
                assetRepayStatusRef.timestampDebt = 0;
                assetRepayStatusRef.amountDebtRepaid += debtWithInterest;
                amountTokenNet -= debtWithInterest;
            } else {
                // amount of the repay is NOT enough to pay back the debt, pay the debt first
                assetRepayStatusRef.amountDebt = debtWithInterest - amountTokenNet;    // Use the debt with interest to update
                assetRepayStatusRef.timestampDebt = uint32(block.timestamp);       // New debt calculation time
                assetRepayStatusRef.amountDebtRepaid += amountTokenNet;
                amountTokenNet = 0;
            }
        }

        // check if the repay is overdued
        if (uint32(block.timestamp) <= assetRepayStatusRef.timestampNextDue) {
            if ((assetRepayStatusRef.amountRepayDue != 0) && (amountTokenNet != 0)) {
                if (assetRepayStatusRef.amountRepayDue > amountTokenNet) {
                    assetRepayStatusRef.amountRepayDue -= amountTokenNet;
                    amountTokenNet = 0;
                } else {
                    assetRepayStatusRef.amountRepayDue = 0;
                    amountTokenNet -= assetRepayStatusRef.amountRepayDue;
                }
            }

            if (amountTokenNet != 0) {
                // Update the repay amount available to pay the due monthly 
                assetRepayStatusRef.amountRepayReady += amountTokenNet;         // amountTokenNet not checked here just for optim
            }
        } else {
            if ((assetRepayStatusRef.amountRepayDue != 0) && (amountTokenNet != 0)) {
                uint256 overdueDuration = block.timestamp - assetRepayStatusRef.timestampNextDue;
                uint48 overdueWithInterest = uint48(rpow(interestRate, overdueDuration) * uint256(assetRepayStatusRef.amountRepayDue) / (10 ** 27));
                
                if (amountTokenNet >= overdueWithInterest) {
                    // amount of the repay is enough to pay back the overdue
                    assetRepayStatusRef.amountRepayDue = assetTypes[assetStatuseRef.typeAsset].amountRepayMonthly;
                    uint8 nextMonth = assetRepayStatusRef.nextDueMonth + 1;
                    assetRepayStatusRef.nextDueMonth = nextMonth;
                    assetRepayStatusRef.timestampNextDue = uint32(DateTime.addMonthsEnd(assetStatuseRef.onboardTimestamp, nextMonth));

                    assetRepayStatusRef.amountRepayReady += overdueWithInterest;         // ????????????
                    amountTokenNet -= overdueWithInterest;
                } else {
                    // amount of the repay is NOT enough to pay back the due, pay partially
                    uint48 overdueSubstract = uint48(uint256(assetRepayStatusRef.amountRepayDue) * uint256(amountTokenNet) / uint256(overdueWithInterest));
                    assetRepayStatusRef.amountRepayDue -= overdueSubstract;
                    assetRepayStatusRef.amountRepayReady += amountTokenNet;
                    amountTokenNet = 0;
                }
            }
            
            if (amountTokenNet != 0) {
                assetRepayStatusRef.amountPrePay = amountTokenNet;
            }
        }
      
        emit RepayMonthly(msg.sender, assetId, tokenInvest, amountToken);
    }

    function takeRepayment(
        uint32 assetId
    ) external onlyManager {

        AssetDetails storage assetStatuseRef = assetList[assetId];
        require (assetStatuseRef.status == AssetStatus.Onboarded, "RWA: Status not allowed");

        RepayDetails storage assetRepayStatusRef = assetRepayStatus[assetId];
        require (assetRepayStatusRef.nextDueMonth >= 2, "RWA: Not available" ); 

        checkRepayMonthly(assetId);

        uint16 typeAsset = assetStatuseRef.typeAsset;
        uint48 amountTotalYield = assetTypes[typeAsset].investQuota * uint48(assetTypes[typeAsset].amountYieldPerInvest);
        amountTotalYield = amountTotalYield * uint48(assetRepayStatusRef.nextDueMonth);         // All yield up to date

        uint48 deductAmount = assetRepayStatusRef.amountRepayTaken +                // Allready taken away
                              amountTotalYield +                                    // All amount of invest yield should be kept
                              assetRepayStatusRef.amountRepayReady +                // Repay not mature
                              assetRepayStatusRef.amountPrePay;                     // Prepay for next monthly

        require (assetStatuseRef.sumAmountRepaid > deductAmount, "RWA: No repayment matured");

        uint48 amountRepayAvailable = assetStatuseRef.sumAmountRepaid - deductAmount;

        assetRepayStatusRef.amountRepayTaken += amountRepayAvailable;
        address tokenInvest = allInvestTokens[assetList[assetId].tokenId].tokenAddress;

        address receiver = fundReceiver;
        if (fundReceiver == address(0)) receiver = msg.sender;

        TransferHelper.safeTransfer(tokenInvest, receiver, amountRepayAvailable);

        emit TakeRepayment(assetId, tokenInvest, amountRepayAvailable);
    }

    
    function executeClearance(
        uint32 _assetId
    ) external {
        return;
    }
        

    function takeYield(
        uint48 investIndex
    ) external {

        Invest memory investToTake = investList[investIndex];

        require (investToTake.invester == msg.sender, "RWA: Not owner");
        require (investToTake.status == uint8(InvestStatus.InvestNormal), "RWA: Wrong status");

        uint32 assetId = investToTake.assetId;
        AssetDetails storage assetStatuseRef = assetList[assetId];
        require (assetStatuseRef.status == AssetStatus.Onboarded, "RWA: Status not allowed");
       
        checkRepayMonthly(assetId);

        uint8 monthWithYield = assetRepayStatus[assetId].nextDueMonth - investToTake.monthTaken;    // ??? nextDueMonth is always correct while cross the due time ??
        if (uint32(block.timestamp) < assetRepayStatus[assetId].timestampNextDue) monthWithYield -= 1;      // Not mature for current month

        require (monthWithYield > 0, "RWA: Not mature");

        investList[investIndex].monthTaken += monthWithYield;

        uint256 amountToken = uint256(investToTake.numQuota) * uint256(assetTypes[assetStatuseRef.typeAsset].amountYieldPerInvest);
        address tokenInvest = allInvestTokens[assetList[assetId].tokenId].tokenAddress;

        TransferHelper.safeTransfer(tokenInvest, msg.sender, amountToken);

        emit InvestTakeYield(msg.sender, investIndex, monthWithYield, tokenInvest, amountToken);
    }

    /**
     * @dev calcuate x^n on the basis of 10^27
     */
    function rpow(uint256 x, uint256 n) public pure returns (uint256 z) {
        uint256 base = 10 ** 27;
        assembly {
            switch x case 0 {switch n case 0 {z := base} default {z := 0}}
            default {
                switch mod(n, 2) case 0 { z := base } default { z := x }
                let half := div(base, 2)  // for rounding.
                for { n := div(n, 2) } n { n := div(n,2) } {
                    let xx := mul(x, x)
                    if iszero(eq(div(xx, x), x)) { revert(0,0) }
                    let xxRound := add(xx, half)
                    if lt(xxRound, xx) { revert(0,0) }
                    x := div(xxRound, base)
                    if mod(n,2) {
                        let zx := mul(z, x)
                        if and(iszero(iszero(x)), iszero(eq(div(zx, x), z))) { revert(0,0) }
                        let zxRound := add(zx, half)
                        if lt(zxRound, zx) { revert(0,0) }
                        z := div(zxRound, base)
                    }
                }
            }
        }
    }

}
