// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';

import "../interfaces/IRWAsset.sol";

import "../libraries/TickMath.sol";
import "../libraries/TransferHelper.sol";
import "../libraries/DateTime.sol";
import "../libraries/SafeMath.sol";

import "../interfaces/IERC20.sol";
import "../interfaces/IERC20Permit.sol";

import "./RWAssetType.sol";
import "./RWAssetStorage.sol";

// Import this file to use console.log
import "hardhat/console.sol";

contract RWAssetPro is 
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    RWAssetStorage
{
   // Events
    event InvestExit(address indexed user, uint256 investIndex, address tokenInvest, uint256 amountToken);
    event RepayMonthly(address indexed user, uint256 assetId, address tokenInvest, uint256 amountToken, AssetStatus assetStatus);
    event InvestTakeYield(address indexed user, uint256 investIndex, uint256 months, address tokenInvest, uint256 amountToken, uint256 amountAKRE); 
    event TakeRepayment(uint256 assetId, address tokenInvest, uint256 amountToken); 
    event InvestClearance(uint256 assetId, uint256 months, uint256 amountAKRE);
    event ExecuteFinalClearance(uint256 assetId, uint256 amountAKRE, uint256 amountFund);
    event ExecuteSlash(uint256 assetId, uint256 amountAKRE);

    modifier onlyManager() {
        require(msg.sender == assetManager, "RWA: Not manager");
        _;
    }   

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        virtual
        override
        onlyOwner
    {}

    function checkIfSkipMonth (uint32 assetId) internal returns (uint256 interestRate) {
        AssetDetails storage assetStatuseRef = assetList[assetId];
        AssetType storage assetTypesRef = assetTypes[assetStatuseRef.typeAsset];
        interestRate = allInterestRates[assetTypesRef.interestId].ratePerSecond;

        if (assetStatuseRef.status == AssetStatus.Onboarded) {
            RepayDetails storage assetRepayStatusRef = assetRepayStatus[assetId];
            if (uint32(block.timestamp) > assetRepayStatusRef.timestampNextDue) {
                uint8 monthDue = assetRepayStatusRef.monthDueRepay;
                // Check if asset tenure finished
                if (monthDue <= assetTypesRef.tenure) {
                    uint48 debtWithInterest = 0;
                    if (assetRepayStatusRef.amountDebt != 0) {
                        uint256 debtDuration = assetRepayStatusRef.timestampNextDue - assetRepayStatusRef.timestampDebt;
                        debtWithInterest = uint48(SafeMath.rpow(interestRate, debtDuration) * uint256(assetRepayStatusRef.amountDebt) / (10 ** 27));
                        assetClearance[assetId].amountDebtOverdueProduct += uint80(debtDuration * assetRepayStatusRef.amountDebt);
                        // May be more accuratly, to calculate the product, should use: (assetRepayStatusRef.amountDebt + debtWithInterest) / 2 
                        // Not possble to calcuate the product in compound way
                    }
                        
                    uint48 amountDebtNew = debtWithInterest + assetRepayStatusRef.amountRepayDue;
                    assetRepayStatusRef.amountDebt = amountDebtNew;                                         // RepayDue becomes new debt
                    if (amountDebtNew != 0) assetRepayStatusRef.timestampDebt = assetRepayStatusRef.timestampNextDue;

                    monthDue += 1;                                                                          // allow skip to the month tenure + 1 
                    assetRepayStatusRef.monthDueRepay = monthDue;
                    assetRepayStatusRef.timestampNextDue = uint32(DateTime.addMonthsEnd(assetStatuseRef.onboardTimestamp, monthDue));

                    if (assetRepayStatusRef.amountPrePay >= assetTypesRef.amountRepayMonthly) {
                        assetRepayStatusRef.amountRepayDue = 0;                                             //Repay all the monthly due with Prepay
                        assetRepayStatusRef.amountPrePay -= assetTypesRef.amountRepayMonthly;
                    } else {
                        assetRepayStatusRef.amountRepayDue = assetTypesRef.amountRepayMonthly - assetRepayStatusRef.amountPrePay;
                        assetRepayStatusRef.amountPrePay = 0;                                               // All prepay are used
                    }
                }
            }
        }
    }

    function checkClearanceStatus (uint32 assetId) internal returns (AssetStatus assetStatus){
        AssetDetails storage assetStatuseRef = assetList[assetId];
        assetStatus = assetStatuseRef.status;
        if (assetStatus >= AssetStatus.Clearing) return assetStatus;

        RepayDetails storage assetRepayStatusRef = assetRepayStatus[assetId];
        if (assetRepayStatusRef.amountDebt != 0) {
            ClearanceDetails storage assetClearanceRef = assetClearance[assetId];
            uint256 debtDuration = uint32(block.timestamp) - assetRepayStatusRef.timestampDebt;
            uint256 amountDebtOverdueProduct = assetClearanceRef.amountDebtOverdueProduct;
            amountDebtOverdueProduct += uint80(debtDuration * assetRepayStatusRef.amountDebt);
            if (amountDebtOverdueProduct >= assetClearanceRef.productToTriggerClearance) {
              assetStatuseRef.status = AssetStatus.Clearing;
              return AssetStatus.Clearing;
            }
        }
        return assetStatus;
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
        require (msg.sender == assetStatuseRef.assetOwner, "RWA: Not asset owner");
        require (assetStatuseRef.status == AssetStatus.Onboarded, "RWA: Status not allowed");

        uint256 interestRate = checkIfSkipMonth(assetId);

        RepayDetails storage assetRepayStatusRef = assetRepayStatus[assetId];
        require (uint32(block.timestamp) < assetRepayStatusRef.timestampNextDue, "RWA: Repay too late");    // ???Repay cannoy skip to next month

        // Transfer repay token
        address tokenInvest = allInvestTokens[assetStatuseRef.tokenId].tokenAddress;
        TransferHelper.safeTransferFrom(tokenInvest, msg.sender, address(this), amountToken);

        assetStatuseRef.sumAmountRepaid += amountToken;
        uint48 amountTokenNet = amountToken;

        // Check if there is debt pending
        uint256 amountDebtPre = assetRepayStatusRef.amountDebt;
        if (amountDebtPre != 0) {
            uint256 debtDuration = block.timestamp - assetRepayStatusRef.timestampDebt;
            uint48 debtWithInterest = uint48(SafeMath.rpow(interestRate, debtDuration) * amountDebtPre / (10 ** 27));

            if (amountTokenNet >= debtWithInterest) {
                // amount of the repay is enough to pay back the debt
                // Clear the overdue debt product
                assetClearance[assetId].amountDebtOverdueProduct = 0;
                assetRepayStatusRef.amountDebt = 0;
                assetRepayStatusRef.timestampDebt = 0;
                amountTokenNet -= debtWithInterest;
            } else {
                // Amount of the repay is NOT enough to pay back the debt, pay the debt first
                // Recalcute the amountDebtOverdueProduct. The debt product accumulated unless all debt are repaid 
                assetClearance[assetId].amountDebtOverdueProduct += uint80(debtDuration * amountDebtPre);
                assetRepayStatusRef.amountDebt = debtWithInterest - amountTokenNet;     // Use the debt with interest to update
                assetRepayStatusRef.timestampDebt = uint32(block.timestamp);
                amountTokenNet = 0;
            }
        }

        if ((assetRepayStatusRef.amountRepayDue != 0) && (amountTokenNet != 0)) {
            if (assetRepayStatusRef.amountRepayDue > amountTokenNet) {
                assetRepayStatusRef.amountRepayDue -= amountTokenNet;
                amountTokenNet = 0;
            } else {
                amountTokenNet -= assetRepayStatusRef.amountRepayDue;
                assetRepayStatusRef.amountRepayDue = 0;
            }
        }

        if (amountTokenNet != 0) {
            // Update the repay amount available to pay the due monthly 
            assetRepayStatusRef.amountPrePay += amountTokenNet;         // amountTokenNet not checked here just for optim
        }
     
        AssetStatus assetStatus = checkClearanceStatus(assetId);

        emit RepayMonthly(msg.sender, assetId, tokenInvest, amountToken, assetStatus);
    }

    function takeRepayment(
        uint32 assetId
    ) external onlyManager {

        AssetDetails storage assetStatuseRef = assetList[assetId];
        require (assetStatuseRef.status == AssetStatus.Onboarded, "RWA: Status not allowed");

        RepayDetails storage assetRepayStatusRef = assetRepayStatus[assetId];
        require (assetRepayStatusRef.monthDueRepay >= 2, "RWA: Not available" ); 

        checkIfSkipMonth(assetId);

        uint16 typeAsset = assetStatuseRef.typeAsset;
        uint48 amountTotalYield = uint48(assetTypes[typeAsset].investQuota) * uint48(assetTypes[typeAsset].amountYieldPerInvest);
        amountTotalYield = amountTotalYield * uint48(assetRepayStatusRef.monthDueRepay);         // All yield up to date

        uint48 repayCurrentMonth = assetTypes[typeAsset].amountRepayMonthly - assetRepayStatusRef.amountRepayDue;

        uint48 deductAmount = assetRepayStatusRef.amountRepayTaken +                // Amount allready taken away the table
                              amountTotalYield +                                    // All amount of invest yield should be kept
                              repayCurrentMonth +                                   // Repay not mature
                              assetRepayStatusRef.amountPrePay;                     // Prepay for next monthly

        require (assetStatuseRef.sumAmountRepaid > deductAmount, "RWA: No mature repayment");

        uint48 amountRepayAvailable = assetStatuseRef.sumAmountRepaid - deductAmount;

        assetRepayStatusRef.amountRepayTaken += amountRepayAvailable;
        address tokenInvest = allInvestTokens[assetList[assetId].tokenId].tokenAddress;

        address receiver = fundReceiver;
        if (fundReceiver == address(0)) receiver = msg.sender;

        TransferHelper.safeTransfer(tokenInvest, receiver, amountRepayAvailable);

        emit TakeRepayment(assetId, tokenInvest, amountRepayAvailable);
    }

    function executeInvestClearance(uint32 assetId) public {
        checkIfSkipMonth(assetId);
        require (checkClearanceStatus(assetId) == AssetStatus.Clearing, "RWA: Not feasible");

        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = 600;                                           // 10 minutes
        secondsAgos[1] = 0;

        (int56[] memory tickCumulatives, ) = IUniswapV3Pool(oracleSwapPair).observe(secondsAgos);

        int24 arithmeticMeanTick = int24((tickCumulatives[1] - tickCumulatives[0]) / 600);
        uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(arithmeticMeanTick);  

        ClearanceDetails storage assetClearanceRef = assetClearance[assetId];
        assetClearanceRef.priceClearance = sqrtPriceX96;
        uint256 price = sqrtPriceX96 * sqrtPriceX96 / (1 << 128);         // Multipled by 2**64

        uint16 typeAsset = assetList[assetId].typeAsset;
        uint256 monthToClear = assetTypes[typeAsset].tenure + 1 - assetRepayStatus[assetId].monthDueRepay;
        uint256 amountAKREToClear = price * assetTypes[typeAsset].amountYieldPerInvest / (1<<64);
        amountAKREToClear = amountAKREToClear * monthToClear * assetTypes[typeAsset].investQuota;   // To avoid round-down later

        if (assetClearanceRef.amountAKREAvailable < amountAKREToClear) {
            amountAKREToClear = assetClearanceRef.amountAKREAvailable / monthToClear / assetTypes[typeAsset].investQuota;
            amountAKREToClear = amountAKREToClear * monthToClear * assetTypes[typeAsset].investQuota;
        }

        assetClearanceRef.amountAKREAvailable -= uint96(amountAKREToClear);
        assetClearanceRef.amountAKREForInvester = uint96(amountAKREToClear);

        assetList[assetId].status = AssetStatus.ClearedInvester;
        emit InvestClearance(assetId, monthToClear, amountAKREToClear);
    }

    function executeFinalClearance(
        uint32 assetId,
        uint96 amountAKRESlash,
        uint96 amountAKREFund
    ) external onlyManager {

        executeInvestClearance(assetId);

        ClearanceDetails storage assetClearanceRef = assetClearance[assetId];
        require (assetList[assetId].status == AssetStatus.ClearedInvester, "RWA: Status not allowed");

        uint96 amountAKRERemove = amountAKREFund + amountAKRESlash;
        require (assetClearanceRef.amountAKREAvailable >= amountAKRERemove, "RWA: Wrong amount");

        TransferHelper.safeTransfer(tokenAKRE, slashReceiver, amountAKRESlash);
        TransferHelper.safeTransfer(tokenAKRE, fundReceiver, amountAKREFund);

        uint96 amountAKREUnlockForOwner = assetClearanceRef.amountAKREAvailable - amountAKRERemove;
        if ( amountAKREUnlockForOwner > 0) {
            TransferHelper.safeTransfer(tokenAKRE, assetList[assetId].assetOwner, amountAKREUnlockForOwner);
        }

        assetClearanceRef.amountAKREAvailable = 0;
        assetList[assetId].status  = AssetStatus.ClearedFinal;

        emit ExecuteFinalClearance(assetId, amountAKRESlash, amountAKREFund);
    }

    /**
     * @dev Execute slashing to offset the virtual asset owner while the asset data are abnormal 
     * @param assetId Index of the asset 
     * @param amountAKRE Amount of the AKRE to be slashed
     */
    function executeSlash(
        uint32 assetId,
        uint96 amountAKRE
    ) external onlyManager {

        ClearanceDetails storage assetClearanceRef = assetClearance[assetId];

        require (assetList[assetId].status == AssetStatus.Onboarded, "RWA: Status not allowed");
        require (assetClearanceRef.amountAKREAvailable >= amountAKRE, "RWA: Amount not enough");
        require (assetClearanceRef.timesSlashed < assetClearanceRef.timesSlashTop, "RWA: Reach slash top");

        assetClearanceRef.timesSlashed  += 1;
        assetClearanceRef.amountSlashed += amountAKRE;
        assetClearanceRef.amountAKREAvailable -= amountAKRE;

        if (assetClearanceRef.timesSlashed == assetClearanceRef.timesSlashTop) {
            assetList[assetId].status = AssetStatus.Clearing;
        }

        TransferHelper.safeTransfer(tokenAKRE, slashReceiver, amountAKRE);
        emit ExecuteSlash(assetId, amountAKRE);
    }

    function takeYield(uint48 investIndex) external nonReentrant {

        Invest memory investToTake = investList[investIndex];

        require (investToTake.invester == msg.sender, "RWA: Not owner");
        require (investToTake.status == InvestStatus.InvestNormal, "RWA: Wrong status");

        // Check if skipped to next month 
        uint32 assetId = uint32(investIndex >> 16);
        checkIfSkipMonth(assetId);

        // Even if during clearance, still possible to take yield, as monthDueRepay is locked during clearance.
        AssetDetails storage assetStatuseRef = assetList[assetId];
        AssetStatus assetStatus = assetStatuseRef.status;
        require (assetStatus >= AssetStatus.Onboarded, "RWA: Status not allowed");
       
        uint8 monthWithYield = assetRepayStatus[assetId].monthDueRepay - investToTake.monthTaken - 1;
        
        if (assetStatus <= AssetStatus.Clearing) {
            require (monthWithYield > 0, "RWA: Not mature");
        }

        AssetType storage assetTypesRef = assetTypes[assetStatuseRef.typeAsset];
        address tokenInvest = allInvestTokens[assetStatuseRef.tokenId].tokenAddress;
        uint256 amountToken = 0;

        // Send monthly yield, in one batch if several mature months available
        if (monthWithYield > 0) {
            investList[investIndex].monthTaken += monthWithYield;
            amountToken = uint256(monthWithYield) *                                                     // Duration in month
                                  uint256(investToTake.numQuota) *                                      // Quota of investment
                                  uint256(assetTypesRef.amountYieldPerInvest);                          // Value per investment

            TransferHelper.safeTransfer(tokenInvest, msg.sender, amountToken);

            // Invest completed if all month yield have been taken
            if (investList[investIndex].monthTaken == assetTypesRef.tenure) {
                investToTake.status = InvestStatus.InvestCompleted;                                                     
            }
        }

        uint256 amountAKRECleared = 0;

        // If the assset is alreay in "ClearedInvester" status, send the cleared AKRE tokens, 
        // and indicate current invest being cleared.
        if (assetList[assetId].status >= AssetStatus.ClearedInvester) {
            amountAKRECleared = uint256(investToTake.numQuota) * 
                              uint256(assetClearance[assetId].amountAKREForInvester) / 
                              uint256(assetTypesRef.investQuota);

            TransferHelper.safeTransfer(tokenAKRE, msg.sender, amountAKRECleared);
            investToTake.status = InvestStatus.InvestCleared;
        }

        emit InvestTakeYield(msg.sender, investIndex, monthWithYield, tokenInvest, amountToken, amountAKRECleared);
    }   
}
