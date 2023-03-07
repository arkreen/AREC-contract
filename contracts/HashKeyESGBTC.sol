// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import "./interfaces/IPausable.sol";
import "./interfaces/IERC5192.sol";
import "./ArkreenBuilderTypes.sol";
import "./libraries/TransferHelper.sol";
import "./interfaces/IWETH.sol";
import "./interfaces/IERC20Permit.sol";

// Import this file to use console.log
import "hardhat/console.sol";

contract HashKeyESGBTC is
    OwnableUpgradeable,
    UUPSUpgradeable,
    ERC721EnumerableUpgradeable,
    IERC5192
{
    using AddressUpgradeable for address;

    // Public variables
    string  public    constant NAME             = 'HashKey ESG BTC';
    string  public    constant SYMBOL           = 'HGBTC';
    uint256 public    constant ART_DECIMAL      = 9;
    uint256 private   constant MAX_BRICK_ID     = 4096;
    uint256 private   constant MASK_ID          = 0xFFF;

    string  public baseURI;
    address public tokenHART;                         // HashKey Pro ART
    address public arkreenBuilder;
    address public tokenNative;                       // The wrapped token of the Native token, such as WETH, WMATIC
    mapping(uint256 => uint256) public brickIds;      // Green Id -> Owned brick id list, maximumly 21 bricks, 12 bits each
    mapping(uint256 => uint256) public greenIdLoc;    // Brick Id -> Green Id

    // The total REC amount to greenize the BTC block mined at the same time of HashKey Pro opening ceremony
    uint256 public maxRECToGreenBTC;

     // Events

    // Modifiers
    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'HSKESG: EXPIRED');
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address builder, address hArt, address native, uint256 numBlock) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();        
        __ERC721_init_unchained(NAME, SYMBOL);

        arkreenBuilder      = builder; 
        tokenHART           = hArt;
        tokenNative         = native;
        maxRECToGreenBTC    = numBlock;

        baseURI = 'https://www.arkreen.com/ESGBTC/' ;
    }   

    function postUpdate() external onlyProxy onlyOwner 
    {}

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    /** 
     * @dev Greenize BTC with Native token, such as MATIC.
     * @param bricksToGreen The brick ID list in the format of IDn || ... || ID2 || ID1, each of which is 12 bits.
     * @param deadline The deadline to cancel the transaction.
     * @param badgeInfo The information to be included for climate badge.
     */
    function greenizeBTCNative(
        uint256             bricksToGreen,      
        uint256             deadline,
        BadgeInfo calldata  badgeInfo
    ) external payable ensure(deadline) {                       // Deadline will be checked by router, no need to check here. 

        address actorGreenBTC = _msgSender();
        uint256 amountART = _mintESGBadge(actorGreenBTC, bricksToGreen);        
        
        // Wrap MATIC to WMATIC  
        IWETH(tokenNative).deposit{value: msg.value}();

        // actionBuilderBadge(address,address,uint256,uint256,bool,uint256,(address,string,string,string)): 0x28a5e88d
        bytes memory callData = abi.encodeWithSelector(0x28a5e88d, tokenNative, tokenHART, msg.value,
                                                        amountART, false, deadline, badgeInfo);

        _actionBuilderBadge(abi.encodePacked(callData, actorGreenBTC));     // Pay back to msg.sender already

    }

    /** 
     * @dev Greenize BTC with specified payment token
     * @param tokenPay The token to pay for swapping ART token
     * @param amountPay The maximum amount of tokenPay which will de paid
     * @param bricksToGreen The brick ID list in the format of IDn || ... || ID2 || ID1, each of which is 12 bits
     * @param deadline The deadline to cancel the transaction
     * @param badgeInfo The information to be included for climate badge
     */
    function greenizeBTC(
        address             tokenPay,
        uint256             amountPay,
        uint256             bricksToGreen,   
        uint256             deadline,        
        BadgeInfo calldata  badgeInfo
    ) external ensure(deadline) {                               // Deadline will be checked by router, no need to check here.

        address actorGreenBTC = _msgSender();
        uint256 amountART = _mintESGBadge(actorGreenBTC, bricksToGreen);

        // Transfer payement 
        TransferHelper.safeTransferFrom(tokenPay, actorGreenBTC, address(this), amountPay);
        
        // actionBuilderBadge(address,address,uint256,uint256,bool,uint256,(address,string,string,string)): 0x28a5e88d
        bytes memory callData = abi.encodeWithSelector(0x28a5e88d, tokenPay, tokenHART, amountPay,
                                                        amountART, false, deadline, badgeInfo);

        _actionBuilderBadge(abi.encodePacked(callData, actorGreenBTC));
    }

    /** 
     * @dev Greenize BTC with payment Approval.
     * @param bricksToGreen The brick ID list in the format of IDn || ... || ID2 || ID1, each of which is 12 bits.
     * @param badgeInfo The information to be included for climate badge.
     * @param permitToPay The Permit information to approve the payment token to swap for ART token 
     */
    function greenizeBTCPermit(
        uint256             bricksToGreen,      
        BadgeInfo calldata  badgeInfo,
        Signature calldata  permitToPay
    ) external ensure(permitToPay.deadline) {                     // Deadline will be checked by router, no need to check here. 

        address actorGreenBTC = _msgSender();
        uint256 amountART = _mintESGBadge(actorGreenBTC, bricksToGreen);

        // Permit payment token
        IERC20Permit(permitToPay.token).permit(actorGreenBTC, address(this), 
                        permitToPay.value, permitToPay.deadline, permitToPay.v, permitToPay.r, permitToPay.s);

        // Transfer payement 
        TransferHelper.safeTransferFrom(permitToPay.token, actorGreenBTC, address(this), permitToPay.value);

        // actionBuilderBadge(address,address,uint256,uint256,bool,uint256,(address,string,string,string)): 0x28a5e88d
        bytes memory callData = abi.encodeWithSelector(0x28a5e88d, permitToPay.token, tokenHART, permitToPay.value,
                                                        amountART, false, permitToPay.deadline, badgeInfo);

        _actionBuilderBadge(abi.encodePacked(callData, actorGreenBTC));
    }

    /** 
     * @dev mint ESGBadge to the greenActor
     * @param actorGreenBTC The address of the actor
     * @param bricksToGreen The brick ID list in the format of IDn || ... || ID2 || ID1, each of which is 12 bits
     * @return uint256 The amount ART token to pay for the ESG badge
     */
    function _mintESGBadge(address actorGreenBTC, uint256 bricksToGreen) internal returns (uint256){
        uint256 amountART;
        uint256 brickID;

        bricksToGreen = (bricksToGreen<<4) >> 4;                            // clear 4 msb, uint252
        uint256 greenId = totalSupply() + 1;
        _safeMint(actorGreenBTC, greenId);
        brickIds[greenId] = bricksToGreen;

        while( (brickID = (bricksToGreen & MASK_ID)) != 0) {
            amountART += 1;
            setBrick(brickID, greenId);
            bricksToGreen = bricksToGreen >> 12;
        }
        return amountART * (10**ART_DECIMAL);
    }

    /** 
     * @dev call actionBuilderBadge to buy ART token and mint the Arkreen cliamte badge.
     * @param callData The calling data with actors address attached
     */
    function _actionBuilderBadge(bytes memory callData) internal {
        (bool success, bytes memory returndata) = arkreenBuilder.call(callData);

         if (!success) {
            if (returndata.length > 0) {
                // solhint-disable-next-line no-inline-assembly
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert("HSKESG: Error Call to actionBuilderBadge");
            }
        }        
    }

    /** 
     * @dev set the greenId to the given brick
     */
    function setBrick(uint256 brickId, uint256 greenId) internal {                           //  brickId starts from 1
        require((brickId != 0) || (brickId <= maxRECToGreenBTC), "HSKESG: Wrong Brick ID");
        require( greenIdLoc[brickId] == 0,  "HSKESG: Brick Occupied");
        greenIdLoc[brickId] = greenId;
    }

    /** 
     * @dev Return the given brick information: owner, greenId, and all sibbling bricks
     */
    function ownerBricks(uint256 brickId) external view returns (address owner, uint256 greenId, uint256 bricks) {
        require((brickId != 0) || (brickId <= maxRECToGreenBTC), "HSKESG: Wrong Brick ID");
        greenId = greenIdLoc[brickId];
        owner = ownerOf(greenId);
        bricks = brickIds[greenId];
    }

    /** 
     * @dev Check if the given brick occupied
     */
    function checkBrick(uint256 brickId) external view returns (bool) {         //  brickId starts from 1
        require((brickId != 0) || (brickId <= maxRECToGreenBTC), "HSKESG: Wrong Brick ID");
        return greenIdLoc[brickId] != 0;
    }    

    /**
     * @dev update the maximum REC number to green BTC block
     * @param amountREC type of the managing account
     */
    function setRECAmount(uint256 amountREC) external onlyOwner {
        maxRECToGreenBTC = amountREC;
    }

    /**
     * @dev Approve the token that the  arkreenBuilder smart contract can transfer from this ESG smart contract
     * @param tokens The token list
     */
    function approveBuilder(address[] calldata tokens) external onlyOwner {
        require(arkreenBuilder != address(0), "HSKESG: No Builder");
        for(uint256 i = 0; i < tokens.length; i++) {
            TransferHelper.safeApprove(tokens[i], arkreenBuilder, type(uint256).max);
        }
    }       

    /** 
     * @dev Change the BaseURI
     */
    function setBaseURI(string calldata newBaseURI) external virtual onlyOwner {
        baseURI = newBaseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev Hook that is called before any token transfer. Blocking transfer unless minting
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override (ERC721EnumerableUpgradeable) {
        require(from == address(0), 'ARB: Transfer Not Allowed');
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev get all the brick IDs with in th scope specified by the paramters
     * @param tokeIDStart the starting token ID, from which all brick IDs are returned
     * @param tokeIDEnd the starting token ID, till which all brick IDs are retured
     */
    function getAllBrickIDs(uint256 tokeIDStart, uint256 tokeIDEnd) 
                external view returns (uint256 totalTokens, address[] memory owners, uint256[] memory allBricks) {

        totalTokens = totalSupply();
        if(tokeIDEnd == 0) tokeIDEnd = totalTokens;
        require( (tokeIDStart >= 1) && (tokeIDStart <= tokeIDEnd) && (tokeIDEnd <= totalTokens), 'ARB: Wrong tokeID');

        owners =  new address[](tokeIDEnd - tokeIDStart + 1);
        allBricks = new uint256[](tokeIDEnd - tokeIDStart + 1);
        uint256 offset;
        for (uint256 index = tokeIDStart; index <= tokeIDEnd; index++ ) {
            owners[offset] = ownerOf(index);
            allBricks[offset] = brickIds[index];
            offset += 1;
        }
    }

    function locked(uint256 tokenId) external view returns (bool) {
        require((tokenId > 0) && (tokenId <= totalSupply()), 'ARB: Wrong tokenId');
        return true;  
    }
}
