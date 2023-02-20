// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import './ArkreenActionStorage.sol';
import "./interfaces/IPausable.sol";

import "./libraries/TransferHelper.sol";
import "./interfaces/IERC20.sol";

import "./interfaces/IERC20Permit.sol";
import "./ArkreenActionTypes.sol";
import "./interfaces/IFeSwapRouter.sol";
import "./interfaces/IArkreenRECToken.sol";

// Import this file to use console.log
// import "hardhat/console.sol";

contract ArkreenAction is
    OwnableUpgradeable,
    UUPSUpgradeable,
    ArkreenActionStorage
{
    using AddressUpgradeable for address;

    // Public variables
    string public constant NAME = 'Arkreen Climate Actor';

    // Events


    // Modifiers
    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'ARB: EXPIRED');
        _;
    }
  
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address router) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();     
        routerSwap = router;
    }   

    function postUpdate() external onlyProxy onlyOwner 
    {}

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    /** 
     * @dev Buy the ART token, then offset the bought ART and mint a cliamte badge.
     * @param tokenPay The address of the token to pay for the ART token.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountPay The amount of the payment token. 
     *                  if isExactPay is true, amountPay should be same as the value in permitToPay.
     *                  if isExactPay is false, amountPay means the maximum amount available to pay, if it not zero. 
     * @param amountART The amount of the ART token.
     *                  if isExactPay is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if isExactPay is false, amountART is the amount of ART token to receive.
     * @param isExactPay Which amount is the exact amount
     *                  = true, amountPay is the exact amount of the payment token to pay.
     *                  = false, amountPay is the exact amount of the ART token to receive.
     * @param badgeInfo The information to be included for climate badge.
     */
    function actionOperator(
        address             tokenPay,
        address             tokenART,
        uint256             amountPay,
        uint256             amountART,
        bool                isExactPay,
        uint256             deadline,
        BadgeInfo calldata  badgeInfo
    ) external {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Permit payment token
        address payer = _msgSender();

        // Transfer payement 
        TransferHelper.safeTransferFrom(tokenPay, payer, address(this), amountPay);
        _actionOperator (tokenPay, tokenART, amountPay, amountART, isExactPay, deadline, badgeInfo);
    }


    function _actionOperator(
        address             tokenPay,
        address             tokenART,
        uint256             amountPay,
        uint256             amountART,
        bool                isExactPay,
        uint256             deadline,
        BadgeInfo calldata  badgeInfo
    ) internal {

        address[] memory swapPath = new address[](2);
        swapPath[0] = tokenPay;
        swapPath[1] = tokenART;

        uint256 amountOffset;
        if(isExactPay) {
            IFeSwapRouter(routerSwap).swapExactTokensForTokens(amountPay, amountART, swapPath, address(this), deadline);
            amountOffset = IERC20(tokenART).balanceOf(address(this));
        } else {
            IFeSwapRouter(routerSwap).swapTokensForExactTokens(amountART, amountPay, swapPath, address(this), deadline);
            amountOffset = amountART;
        }

        // offsetAndMintCertificate(address beneficiary,string offsetEntityID,string beneficiaryID,string offsetMessage,uint256 amount)
        // offsetAndMintCertificate(address,string,string,string,uint256): signature = 0x0fba6a8d
        bytes memory callData = abi.encodeWithSelector(0x0fba6a8d, badgeInfo.beneficiary, badgeInfo.offsetEntityID, 
                                            badgeInfo.beneficiaryID, badgeInfo.offsetMessage, amountOffset);

        address payer = _msgSender();
        (bool success, bytes memory returndata) = tokenART.call(abi.encodePacked(callData, payer));

        if (!success) {
            if (returndata.length > 0) {
                // solhint-disable-next-line no-inline-assembly
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert("ACT: Error Call to offsetAndMintCertificate");
            }
        }
  
        uint256 amountPayLeft = IERC20(tokenART).balanceOf(address(this));
        if(amountPayLeft > 0) TransferHelper.safeTransfer(tokenPay, payer, amountPayLeft);

    }


    /** 
     * @dev Buy the ART token, then offset the bought ART and mint a cliamte badge.
     * @param tokenPay The address of the token to pay for the ART token.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountPay The amount of the payment token. 
     *                  if isExactPay is true, amountPay should be same as the value in permitToPay.
     *                  if isExactPay is false, amountPay means the maximum amount available to pay, if it not zero. 
     * @param amountART The amount of the ART token.
     *                  if isExactPay is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if isExactPay is false, amountART is the amount of ART token to receive.
     * @param isExactPay Which amount is the exact amount
     *                  = true, amountPay is the exact amount of the payment token to pay.
     *                  = false, amountPay is the exact amount of the ART token to receive.
     * @param badgeInfo The information to be included for climate badge.
     * @param permitToPay The permit information to approve the payment token to swap for ART token 
     */
    function actionOperatorWithPermit(
        address             tokenPay,
        address             tokenART,
        uint256             amountPay,
        uint256             amountART,
        bool                isExactPay,
        BadgeInfo calldata  badgeInfo,
        Signature calldata  permitToPay
    ) external  {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        require(amountPay == permitToPay.value, "ACT: Wrong payment value");

        // Permit payment token
        address payer = _msgSender();
        IERC20Permit(permitToPay.token).permit(payer, address(this), 
                        permitToPay.value, permitToPay.deadline, permitToPay.v, permitToPay.r, permitToPay.s);

        // Transfer payement 
        TransferHelper.safeTransferFrom(permitToPay.token, payer, address(this), permitToPay.value);

        address[] memory swapPath = new address[](2);
        swapPath[0] = tokenPay;
        swapPath[1] = tokenART;

        uint256 amountOffset;
        if(isExactPay) {
            IFeSwapRouter(routerSwap).swapExactTokensForTokens(amountPay, amountART, swapPath, address(this), permitToPay.deadline);
            amountOffset = IERC20(tokenART).balanceOf(address(this));
        } else {
            IFeSwapRouter(routerSwap).swapTokensForExactTokens(amountART, amountPay, swapPath, address(this), permitToPay.deadline);
            amountOffset = amountART;
        }

        // offsetAndMintCertificate(address beneficiary,string offsetEntityID,string beneficiaryID,string offsetMessage,uint256 amount)
        // offsetAndMintCertificate(address,string,string,string,uint256): signature = 0x0fba6a8d
        bytes memory callData = abi.encodeWithSelector(0x0fba6a8d, badgeInfo.beneficiary, badgeInfo.offsetEntityID, 
                                            badgeInfo.beneficiaryID, badgeInfo.offsetMessage, amountOffset);

        (bool success, bytes memory returndata) = tokenART.call(abi.encodePacked(callData, payer));

        if (!success) {
            if (returndata.length > 0) {
                // solhint-disable-next-line no-inline-assembly
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert("ACT: Error Call to offsetAndMintCertificate");
            }
        }
  
        uint256 amountPayLeft = IERC20(tokenART).balanceOf(address(this));
        if(amountPayLeft > 0) TransferHelper.safeTransfer(tokenPay, payer, amountPayLeft);

    }

    function approveRouter(address[] memory tokens) external onlyOwner {
        require(routerSwap != address(0), "ACT: No Router");
        for(uint256 i = 0; i < tokens.length; i++) {
            TransferHelper.safeApprove(tokens[i], routerSwap, type(uint256).max);
        }
    }    

    function getVersion() external pure virtual returns (string memory) {
        return "0.1.0";
    }
}
