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
import "./interfaces/IArkreenRECBank.sol";
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

    function initialize(address router, address sales, address native) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();     
        routerSwap = router;
        artBank = sales;
        tokenNative = native;
    }   

    function postUpdate(address sales) external onlyProxy onlyOwner {
        artBank = sales;
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    receive() external payable {
        assert(msg.sender == tokenNative); // only accept WMATIC via fallback from the WMATIC contract
    }  

    /** 
     * @dev Offset the specified amount of ART tokens to create a climate action.
     * @param tokenART Address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountART Amount of the ART token to offset.
     * @param deadline Deadline to handle the transaction.
     */
    function actionBuilderWithART(
        address             tokenART,
        uint256             amountART,
        uint256             deadline
    ) external ensure(deadline) {

        // Transfer payement: bytes4(keccak256(bytes('transferFrom(address from ,address to ,uint256 amount)')));
        bytes memory data1 = abi.encodeWithSelector(0x23b872dd, msg.sender, address(this), amountART);
        (bool success, bytes memory data) = tokenART.call(abi.encodePacked(data1, address(this)));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');

        // commitOffset(uint256 amount): 0xe8fef571
        bytes memory callData = abi.encodeWithSelector(0xe8fef571, amountART);

        _offsetART(tokenART, abi.encodePacked(callData, _msgSender()));
    }
   

    /** 
     * @dev Buy the ART token with specified token, then offset the bought ART to create a climate action.
     * @param tokenPay The address of the token to pay for the ART token.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountPay The amount of the payment token. 
     *                  if modeAction bit0 is true, amountPay should be paid to swap tokenART.
     *                  if modeAction bit0 is false, amountPay means the maximum amount to pay. 
     * @param amountART The amount of the ART token.
     *                  if modeAction bit0 is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if modeAction bit0 is false, amountART is the amount of ART token to receive.
     * @param modeAction Which amount is the exact amount, and which source to get ART
     *                  bit0 = 1, amountPay is the exact amount of the payment token to pay.
     *                  bit0 = 0, amountART is the exact amount of the ART token to receive.
     *                  bit1 = 0, Swap ART from Dex
     *                  bit1 = 1, But ART from art sales bank
     */
    function actionBuilder(
        address             tokenPay,
        address             tokenART,
        uint256             amountPay,
        uint256             amountART,
        uint256             modeAction,
        uint256             deadline
    ) external {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Transfer payement 
        TransferHelper.safeTransferFrom(tokenPay, msg.sender, address(this), amountPay);
        _actionBuilder (tokenPay, tokenART, amountPay, amountART, modeAction, deadline);
    }

    /** 
     * @dev Buy the ART token with Native token, then offset the bought ART.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in the AREC ecosystem.
     * @param amountART The amount of the ART token.
     *                  if modeAction bit0 is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if modeAction bit0 is false, amountART is the amount of ART token to receive.
     * @param modeAction Which amount is the exact amount, and which source to get ART
     *                  bit0 = 1, amountPay is the exact amount of the payment token to pay.
     *                  bit0 = 0, amountART is the exact amount of the ART token to receive.
     *                  bit1 = 0, Swap ART from Dex
     *                  bit1 = 1, But ART from art sales bank
     */
    function actionBuilderNative(
        address             tokenART,
        uint256             amountART,
        uint256             modeAction,
        uint256             deadline
    ) external payable {               // Deadline will be checked by router, no need to check here.

        // Wrap MATIC to WMATIC  
        IWETH(tokenNative).deposit{value: msg.value}();
        _actionBuilder(tokenNative, tokenART, msg.value, amountART, modeAction, deadline);
    }   

   /** 
     * @dev Buy the ART token with specified token, then offset the bought ART.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountART The amount of the ART token.
     *                  if modeAction bit0 is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if modeAction bit0 is false, amountART is the amount of ART token to receive.
     * @param modeAction Which amount is the exact amount, and which source to get ART
     *                  bit0 = 1, amountPay is the exact amount of the payment token to pay.
     *                  bit0 = 0, amountART is the exact amount of the ART token to receive.
     *                  bit1 = 0, Swap ART from Dex
     *                  bit1 = 1, But ART from art sales bank
     * @param permitToPay The permit information to approve the payment token to swap for ART token 
     */
    function actionBuilderWithPermit(
        address             tokenART,
        uint256             amountART,
        uint256             modeAction,
        Signature calldata  permitToPay
    ) external  {                       // Deadline will be checked by router, no need to check here.
        // Permit payment token
        address payer = msg.sender;
        IERC20Permit(permitToPay.token).permit(payer, address(this), 
                        permitToPay.value, permitToPay.deadline, permitToPay.v, permitToPay.r, permitToPay.s);

        // Transfer payement 
        TransferHelper.safeTransferFrom(permitToPay.token, payer, address(this), permitToPay.value);
        _actionBuilder(permitToPay.token, tokenART, permitToPay.value, amountART, modeAction, permitToPay.deadline);
    }

    /** 
     * @dev Offset the specified amount of ART tokens to create a climate action.
     * @param tokenART Address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountART Amount of the ART token to offset.
     * @param deadline Deadline to handle the transaction.
     * @param badgeInfo The information to be included for climate badge.
     */
    function actionBuilderBadgeWithART(
        address             tokenART,
        uint256             amountART,
        uint256             deadline,
        BadgeInfo calldata  badgeInfo
    ) external ensure(deadline) {

        // Transfer payement: bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
        bytes memory data1 = abi.encodeWithSelector(0x23b872dd, msg.sender, address(this), amountART);
        (bool success, bytes memory data) = tokenART.call(abi.encodePacked(data1, address(this)));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');

        // offsetAndMintCertificate(address beneficiary,string offsetEntityID,string beneficiaryID,string offsetMessage,uint256 amount)
        // offsetAndMintCertificate(address,string,string,string,uint256): signature = 0x0fba6a8d
        bytes memory callData = abi.encodeWithSelector(0x0fba6a8d, badgeInfo.beneficiary, badgeInfo.offsetEntityID, 
                                            badgeInfo.beneficiaryID, badgeInfo.offsetMessage, amountART);

        _offsetART(tokenART, abi.encodePacked(callData, _msgSender()));
    }    

    /** 
     * @dev Buy the ART token, then offset the bought ART and mint a cliamte badge.
     * @param tokenPay The address of the token to pay for the ART token.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountPay The amount of the payment token. 
     *                  if modeAction bit0 is true, amountPay should be same as the value in permitToPay.
     *                  if modeAction bit0 is false, amountPay means the maximum amount available to pay, if it not zero. 
     * @param amountART The amount of the ART token.
     *                  if modeAction bit0 is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if modeAction bit0 is false, amountART is the amount of ART token to receive.
     * @param modeAction Which amount is the exact amount, and which source to get ART
     *                  bit0 = 1, amountPay is the exact amount of the payment token to pay.
     *                  bit0 = 0, amountART is the exact amount of the ART token to receive.
     *                  bit1 = 0, Swap ART from Dex
     *                  bit1 = 1, But ART from art sales bank     
     *                  bit2 = 0, re-pay to _msgSender()
     *                  bit2 = 1, re-pay to msg.sender
     * @param badgeInfo The information to be included for climate badge.
     */
    function actionBuilderBadge(
        address             tokenPay,
        address             tokenART,
        uint256             amountPay,
        uint256             amountART,
        uint256             modeAction,
        uint256             deadline,
        BadgeInfo calldata  badgeInfo
    ) external {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Transfer payement
        TransferHelper.safeTransferFrom(tokenPay, msg.sender, address(this), amountPay);

        _actionBuilderBadge (tokenPay, tokenART, amountPay, amountART, modeAction, deadline, badgeInfo);
    }

    /** 
     * @dev Buy the ART token, then offset the bought ART and mint a cliamte badge.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountART The amount of the ART token.
     *                  if modeAction bit0 is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if modeAction bit0 is false, amountART is the amount of ART token to receive.
     * @param modeAction Which amount is the exact amount, and which source to get ART
     *                  bit0 = 1, amountPay is the exact amount of the payment token to pay.
     *                  bit0 = 0, amountART is the exact amount of the ART token to receive.
     *                  bit1 = 0, Swap ART from Dex
     *                  bit1 = 1, But ART from art sales bank   
     * @param badgeInfo The information to be included for climate badge.
     */
    function actionBuilderBadgeNative(
        address             tokenART,
        uint256             amountART,
        uint256             modeAction,
        uint256             deadline,
        BadgeInfo calldata  badgeInfo
    ) external payable {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Wrap MATIC to WMATIC  
        IWETH(tokenNative).deposit{value: msg.value}();
        _actionBuilderBadge(tokenNative, tokenART, msg.value, amountART, modeAction, deadline, badgeInfo);
    }

   /** 
     * @dev Buy the ART token, then offset the bought ART and mint a cliamte badge.
     * @param tokenART The address of the ART token. There may be serveral different ART tokens in AREC ecosystem.
     * @param amountART The amount of the ART token.
     *                  if modeAction bit0 is true, amountART means the minumum ART token to receive, which may be zero for no checking.
     *                  if modeAction bit0 is false, amountART is the amount of ART token to receive.
     * @param modeAction Which amount is the exact amount, and which source to get ART
     *                  bit0 = 1, amountPay is the exact amount of the payment token to pay.
     *                  bit0 = 0, amountART is the exact amount of the ART token to receive.
     *                  bit1 = 0, Swap ART from Dex
     *                  bit1 = 1, But ART from art sales bank   
     * @param badgeInfo The information to be included for climate badge.
     * @param permitToPay The permit information to approve the payment token to swap for ART token 
     */
    function actionBuilderBadgeWithPermit(
        address             tokenART,
        uint256             amountART,
        uint256             modeAction,
        BadgeInfo calldata  badgeInfo,
        Signature calldata  permitToPay
    ) external  {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Permit payment token
        address payer = msg.sender;
        IERC20Permit(permitToPay.token).permit(payer, address(this), 
                        permitToPay.value, permitToPay.deadline, permitToPay.v, permitToPay.r, permitToPay.s);

        // Transfer payement 
        TransferHelper.safeTransferFrom(permitToPay.token, payer, address(this), permitToPay.value);
        _actionBuilderBadge(permitToPay.token, tokenART, permitToPay.value, amountART, modeAction, permitToPay.deadline, badgeInfo);
    }

    function _actionBuilder(
        address             tokenPay,
        address             tokenART,
        uint256             amountPay,
        uint256             amountART,
        uint256             modeAction,
        uint256             deadline
    ) internal {

        bool isExact = (modeAction&0x01) == 0x01;
        if(modeAction & 0x02 != 0x00) {
            IArkreenRECBank(artBank).buyART(tokenPay, tokenART, amountPay, amountART, isExact);
        } else {
          address[] memory swapPath = new address[](2);
          swapPath[0] = tokenPay;
          swapPath[1] = tokenART;

          if(isExact) {
              IFeSwapRouter(routerSwap).swapExactTokensForTokens(amountPay, amountART, swapPath, address(this), deadline);
          } else {
              IFeSwapRouter(routerSwap).swapTokensForExactTokens(amountART, amountPay, swapPath, address(this), deadline);
          }
        }

        uint256 amountOffset = amountART;  
        if(isExact)  amountOffset = IERC20(tokenART).balanceOf(address(this));    // Pleae do not send ART to this contract
 
        // commitOffset(uint256 amount): 0xe8fef571
        bytes memory callData = abi.encodeWithSelector(0xe8fef571, amountOffset);

        address payer = _msgSender();
        _offsetART(tokenART, abi.encodePacked(callData, payer));
 
        // Repay more payment back  
        _payBackOverPayment(tokenPay, payer, modeAction);
    }

    function _actionBuilderBadge(
        address             tokenPay,
        address             tokenART,
        uint256             amountPay,
        uint256             amountART,
        uint256             modeAction,
        uint256             deadline,
        BadgeInfo calldata  badgeInfo
    ) internal {

        bool isExact = (modeAction&0x01) == 0x01;
        if(modeAction & 0x02 != 0x00) {
            IArkreenRECBank(artBank).buyART(tokenPay, tokenART, amountPay, amountART, isExact);
        } else {
          address[] memory swapPath = new address[](2);
          swapPath[0] = tokenPay;
          swapPath[1] = tokenART;

          if(modeAction & 0x01 != 0x00) {
              IFeSwapRouter(routerSwap).swapExactTokensForTokens(amountPay, amountART, swapPath, address(this), deadline);
          } else {
              IFeSwapRouter(routerSwap).swapTokensForExactTokens(amountART, amountPay, swapPath, address(this), deadline);
          }
        }

        uint256 amountOffset = amountART;  
        if(isExact)  amountOffset = IERC20(tokenART).balanceOf(address(this));        

        // offsetAndMintCertificate(address beneficiary,string offsetEntityID,string beneficiaryID,string offsetMessage,uint256 amount)
        // offsetAndMintCertificate(address,string,string,string,uint256): signature = 0x0fba6a8d
        bytes memory callData = abi.encodeWithSelector(0x0fba6a8d, badgeInfo.beneficiary, badgeInfo.offsetEntityID, 
                                            badgeInfo.beneficiaryID, badgeInfo.offsetMessage, amountOffset);

        address payer = _msgSender();
        _offsetART(tokenART, abi.encodePacked(callData, payer));
  
        // Repay more payment back  
        _payBackOverPayment(tokenPay, payer, modeAction);
    }

    function _payBackOverPayment(
        address tokenPay,
        address msgSender,
        uint256 modeAction
    ) internal {
        if(modeAction & 0x01 == 0x00) {      
            address repayTo = (modeAction & 0x04 != 0x00) ? msg.sender : msgSender;

            uint256 amountPayLeft = IERC20(tokenPay).balanceOf(address(this));
            if(amountPayLeft > 0) {
                if((tokenPay == tokenNative) && !address(repayTo).isContract()) {
                    IWETH(tokenNative).withdraw(amountPayLeft);
                    TransferHelper.safeTransferETH(repayTo, amountPayLeft);
                } else {
                    TransferHelper.safeTransfer(tokenPay, repayTo, amountPayLeft);
                }
            }
        }
    }

    /** 
     * @dev Call ART token contract to offset the ART token, and optoinally mint the climate badge according to calldata.
     * @param tokenART Address of the ART token contract. 
     * @param callData Calldata to call ART token.
     */
    function _offsetART(
        address         tokenART,
        bytes   memory  callData
    ) internal {

        (bool success, bytes memory returndata) = tokenART.call(abi.encodePacked(callData, _msgSender()));

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

    function approveArtBank(address[] memory tokens) external onlyOwner {
        require(artBank != address(0), "BLD: No Banker");
        for(uint256 i = 0; i < tokens.length; i++) {
            TransferHelper.safeApprove(tokens[i], artBank, type(uint256).max);
        }
    }

    function getVersion() external pure virtual returns (string memory) {
        return "0.2.0";
    }
}
