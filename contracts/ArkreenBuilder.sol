// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import './ArkreenBuilderStorage.sol';
import "./interfaces/IPausable.sol";

import "./libraries/TransferHelper.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IWETH.sol";

import "./interfaces/IERC20Permit.sol";
import "./ArkreenBuilderTypes.sol";
import "./interfaces/IFeSwapRouter.sol";
import "./interfaces/IArkreenRECToken.sol";

// Import this file to use console.log
// import "hardhat/console.sol";

contract ArkreenBuilder is
    OwnableUpgradeable,
    UUPSUpgradeable,
    ArkreenBuilderStorage
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

    function initialize(address router, address native) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();     
        routerSwap = router;
        tokenNative = native;
    }   

    function postUpdate() external onlyProxy onlyOwner 
    {}

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    receive() external payable {
        assert(msg.sender == tokenNative); // only accept WMATIC via fallback from the WMATIC contract
    }  

    /** 
     * @dev Buy the ART token with specified token, then offset the bought ART to create a climate action.
     * @param tokenPay The address of the token to pay for the ART token.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountPay The amount of the payment token. 
     *                  if isExactPay is true, amountPay should be paid to swap tokenART.
     *                  if isExactPay is false, amountPay means the maximum amount to pay. 
     * @param amountART The amount of the ART token.
     *                  if isExactPay is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if isExactPay is false, amountART is the amount of ART token to receive.
     * @param isExactPay Which amount is the exact amount
     *                  = true, amountPay is the exact amount of the payment token to pay.
     *                  = false, amountART is the exact amount of the ART token to receive.
     */
    function actionBuilder(
        address             tokenPay,
        address             tokenART,
        uint256             amountPay,
        uint256             amountART,
        bool                isExactPay,
        uint256             deadline
    ) external {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Transfer payement 
        TransferHelper.safeTransferFrom(tokenPay, msg.sender, address(this), amountPay);
        _actionBuilder (tokenPay, tokenART, amountPay, amountART, isExactPay, deadline);
    }

    /** 
     * @dev Buy the ART token with Native token, then offset the bought ART.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in the AREC ecosystem.
     * @param amountART The amount of the ART token.
     *                  if isExactPay is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if isExactPay is false, amountART is the amount of ART token to receive.
     * @param isExactPay Which amount is the exact amount
     *                  = true,  msg.value is the exact amount of the payment token to pay.
     *                  = false, amountART is the exact amount of the ART token to receive.
     */
    function actionBuilderNative(
        address             tokenART,
        uint256             amountART,
        bool                isExactPay,
        uint256             deadline
    ) external payable {               // Deadline will be checked by router, no need to check here.

        // Wrap MATIC to WMATIC  
        IWETH(tokenNative).deposit{value: msg.value}();
        _actionBuilder(tokenNative, tokenART, msg.value, amountART, isExactPay, deadline);
    }   

   /** 
     * @dev Buy the ART token with specified token, then offset the bought ART.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountART The amount of the ART token.
     *                  if isExactPay is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if isExactPay is false, amountART is the amount of ART token to receive.
     * @param isExactPay Which amount is the exact amount
     *                  = true, amountPay is the exact amount of the payment token to pay.
     *                  = false, tokenART is the exact amount of the ART token to receive.
     * @param permitToPay The permit information to approve the payment token to swap for ART token 
     */
    function actionBuilderWithPermit(
        address             tokenART,
        uint256             amountART,
        bool                isExactPay,
        Signature calldata  permitToPay
    ) external  {                       // Deadline will be checked by router, no need to check here.
        // Permit payment token
        address payer = _msgSender();
        IERC20Permit(permitToPay.token).permit(payer, address(this), 
                        permitToPay.value, permitToPay.deadline, permitToPay.v, permitToPay.r, permitToPay.s);

        // Transfer payement 
        TransferHelper.safeTransferFrom(permitToPay.token, payer, address(this), permitToPay.value);
        _actionBuilder(permitToPay.token, tokenART, permitToPay.value, amountART, isExactPay, permitToPay.deadline);
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
     *                  = false, amountART is the exact amount of the ART token to receive.
     * @param badgeInfo The information to be included for climate badge.
     */
    function actionBuilderBadge(
        address             tokenPay,
        address             tokenART,
        uint256             amountPay,
        uint256             amountART,
        bool                isExactPay,
        uint256             deadline,
        BadgeInfo calldata  badgeInfo
    ) external {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Transfer payement
        TransferHelper.safeTransferFrom(tokenPay, msg.sender, address(this), amountPay);
        _actionBuilderBadge (tokenPay, tokenART, amountPay, amountART, isExactPay, deadline, badgeInfo);
    }

    /** 
     * @dev Buy the ART token, then offset the bought ART and mint a cliamte badge.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountART The amount of the ART token.
     *                  if isExactPay is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if isExactPay is false, amountART is the amount of ART token to receive.
     * @param isExactPay Which amount is the exact amount
     *                  = true,  msg.value is the exact amount of the payment token to pay.
     *                  = false, amountART is the exact amount of the ART token to receive.
     * @param badgeInfo The information to be included for climate badge.
     */
    function actionBuilderBadgeNative(
        address             tokenART,
        uint256             amountART,
        bool                isExactPay,
        uint256             deadline,
        BadgeInfo calldata  badgeInfo
    ) external payable {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Wrap MATIC to WMATIC  
        IWETH(tokenNative).deposit{value: msg.value}();
        _actionBuilderBadge(tokenNative, tokenART, msg.value, amountART, isExactPay, deadline, badgeInfo);
    }

   /** 
     * @dev Buy the ART token, then offset the bought ART and mint a cliamte badge.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountART The amount of the ART token.
     *                  if isExactPay is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if isExactPay is false, amountART is the amount of ART token to receive.
     * @param isExactPay Which amount is the exact amount
     *                  = true, amountPay is the exact amount of the payment token to pay.
     *                  = false, tokenART is the exact amount of the ART token to receive.
     * @param badgeInfo The information to be included for climate badge.
     * @param permitToPay The permit information to approve the payment token to swap for ART token 
     */
    function actionBuilderBadgeWithPermit(
        address             tokenART,
        uint256             amountART,
        bool                isExactPay,
        BadgeInfo calldata  badgeInfo,
        Signature calldata  permitToPay
    ) external  {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Permit payment token
        address payer = _msgSender();
        IERC20Permit(permitToPay.token).permit(payer, address(this), 
                        permitToPay.value, permitToPay.deadline, permitToPay.v, permitToPay.r, permitToPay.s);

        // Transfer payement 
        TransferHelper.safeTransferFrom(permitToPay.token, payer, address(this), permitToPay.value);
        _actionBuilderBadge(permitToPay.token, tokenART, permitToPay.value, amountART, isExactPay, permitToPay.deadline, badgeInfo);
    }

    function _actionBuilder(
        address             tokenPay,
        address             tokenART,
        uint256             amountPay,
        uint256             amountART,
        bool                isExactPay,
        uint256             deadline
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

        // commitOffset(uint256 amount): 0xe8fef571
        bytes memory callData = abi.encodeWithSelector(0xe8fef571, amountOffset);

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
                revert("BLD: Error Call to commitOffset");
            }
        }
  
        // Repay more payment back  
        if(!isExactPay) {
            uint256 amountPayLeft = IERC20(tokenPay).balanceOf(address(this));
            if(amountPayLeft > 0) {
                if(tokenPay == tokenNative) {
                    IWETH(tokenNative).withdraw(amountPayLeft);
                    TransferHelper.safeTransferETH(payer, amountPayLeft);               
                } else {
                    TransferHelper.safeTransfer(tokenPay, payer, amountPayLeft);
                }
            }
        }
    }

    function _actionBuilderBadge(
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
                revert("BLD: Error Call to offsetAndMintCertificate");
            }
        }
  
        // Repay more payment back  
        if(!isExactPay) {
            uint256 amountPayLeft = IERC20(tokenPay).balanceOf(address(this));
            if(amountPayLeft > 0) {
                if(tokenPay == tokenNative) {
                    IWETH(tokenNative).withdraw(amountPayLeft);
                    TransferHelper.safeTransferETH(payer, amountPayLeft);               
                } else {
                    TransferHelper.safeTransfer(tokenPay, payer, amountPayLeft);
                }
            }
        }
    }

    function _msgSender() internal override view returns (address signer) {
        signer = msg.sender;
        if (msg.data.length>=20 && trustedForwarders[signer]) {
            assembly {
                signer := shr(96,calldataload(sub(calldatasize(),20)))
            }
        }    
    }    

    function mangeTrustedForwarder(address forwarder, bool addOrRemove) external onlyOwner {
        require(forwarder != address(0), "BLD: Zero Forwarder");
        trustedForwarders[forwarder] = addOrRemove;
    }      
 
    function approveRouter(address[] memory tokens) external onlyOwner {
        require(routerSwap != address(0), "BLD: No Router");
        for(uint256 i = 0; i < tokens.length; i++) {
            TransferHelper.safeApprove(tokens[i], routerSwap, type(uint256).max);
        }
    }    

    function getVersion() external pure virtual returns (string memory) {
        return "0.1.0";
    }
}
