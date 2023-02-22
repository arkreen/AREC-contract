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
    string  public    constant NAME         = 'HashKey ESG BTC';
    string  public    constant SYMBOL       = 'HGBTC';
    uint256 public    constant ART_DECIMAL  = 9;
    uint256 private   constant MAX_BRICK_ID = 4096;
    uint256 private   constant MASK_ID      = 0xFFF;


    string  public baseURI;
    address public tokenHART;                         // HashKey Pro ART
    address public arkreenBuilder;
    address public tokenNative;                       // The wrapped token of the Native token, such as WETH, WMATIC
//  mapping(uint256 => uint256) public bricksState;   // Brick Id (Offset) -> Occupied status, If occupied, the bit is SET.
    mapping(uint256 => uint256) public brickIds;      // Green Id -> Owned brick id list, maximumly 21 bricks, 12 bits each
    mapping(uint256 => uint256) public greenIdLoc;    // Brick Id -> Green Id

    // The total REC amount to greenize the BTC block mined at the same time of HashKey Pro opening ceremony
    uint256 public maxRECToGreenBTC;

     // Events
    event ArkreenRegistryUpdated(address newArkreenRegistry);
    event OffsetCertificateMinted(uint256 tokenId);
    event OffsetCertificateUpdated(uint256 tokenId);

    // Modifiers
    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'ARB: EXPIRED');
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
        arkreenBuilder = builder; 
        tokenHART = hArt;
        tokenNative = native;
        maxRECToGreenBTC = numBlock;

        baseURI = 'https://www.arkreen.com/ESGBTC/' ;
    }   

    function postUpdate() external onlyProxy onlyOwner 
    {}

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    function greenizeBTCNative(
        uint256             bricksToGreen,      
        uint256             deadline,
        BadgeInfo calldata  badgeInfo
    ) external payable {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        uint256 amountART;
        uint256 brickID;
        address actorGreenBTC = _msgSender();
        
        bricksToGreen = (bricksToGreen<<4) >> 4;                            // clear 4 msb
        uint256 greenId = totalSupply() + 1;
        _safeMint(actorGreenBTC, greenId);
        bricksId[greenId] = bricksToGreen;

        while( (brickID = (bricksToGreen & MASK_ID)) != 0) {
            amountART += 1;
            setBrick(brickID, greenId);
            bricksToGreen = bricksToGreen >> 12;
        }
        
        // Wrap MATIC to WMATIC  
        IWETH(tokenNative).deposit{value: msg.value}();
        amountART = amountART * (10**ART_DECIMAL);

        // actionBuilderBadge(address,address,uint256,uint256,bool,uint256,(address,string,string,string)): 0x28a5e88d
        bytes memory callData = abi.encodeWithSelector(0x28a5e88d, tokenNative, tokenHART, msg.value,
                                                        amountART, false, deadline, badgeInfo);

        _actionBuilderBadge(abi.encodePacked(callData, actorGreenBTC));




    }

    function greenizeBTC(
        address             tokenPay,
        uint256             amountPay,
        uint256             bricksToGreen1,      
        uint256             bricksToGreen2,
        uint256             deadline,        
        BadgeInfo calldata  badgeInfo
    ) external  {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Transfer payement 
        address actorGreenBTC = _msgSender();
        TransferHelper.safeTransferFrom(tokenPay, actorGreenBTC, address(this), amountPay);
        uint256 amountART = ((bricksToGreen1 & MASK_ID) + (bricksToGreen2 & MASK_ID)) * (10**ART_DECIMAL);

        // actionBuilderBadge(address,address,uint256,uint256,bool,uint256,(address,string,string,string)): 0x28a5e88d
        bytes memory callData = abi.encodeWithSelector(0x28a5e88d, tokenPay, tokenHART, amountPay,
                                                        amountART, false, deadline, badgeInfo);

        _actionBuilderBadge(abi.encodePacked(callData, actorGreenBTC));
    }

    /** 
     * @dev Greenize BTC with Approval payment signature.
     * @param bricksToGreen1 The firts list of brick IDs in the format of ID1 || ID2 || .. || IDn || Length, each of which is 16 bits.
     * @param bricksToGreen2 The second list of brick IDs. 
     * @param badgeInfo The information to be included for climate badge.
     * @param permitToPay The permit information to approve the payment token to swap for ART token 
     */
    function greenizeBTCPermit(
        uint256             bricksToGreen1,      
        uint256             bricksToGreen2,
        BadgeInfo calldata  badgeInfo,
        Signature calldata  permitToPay
    ) external  {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Permit payment token
        address actorGreenBTC = _msgSender();
        IERC20Permit(permitToPay.token).permit(actorGreenBTC, address(this), 
                        permitToPay.value, permitToPay.deadline, permitToPay.v, permitToPay.r, permitToPay.s);

        // Transfer payement 
        TransferHelper.safeTransferFrom(permitToPay.token, actorGreenBTC, address(this), permitToPay.value);
        uint256 amountART = ((bricksToGreen1 & MASK_ID) + (bricksToGreen2 & MASK_ID)) * (10**ART_DECIMAL);

        // actionBuilderBadge(address,address,uint256,uint256,bool,uint256,(address,string,string,string)): 0x28a5e88d
        bytes memory callData = abi.encodeWithSelector(0x28a5e88d, permitToPay.token, tokenHART, permitToPay.value,
                                                        amountART, false, permitToPay.deadline, badgeInfo);

        _actionBuilderBadge(abi.encodePacked(callData, actorGreenBTC));
    }

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
/*
    function setBrick(uint256 brickId) internal {                               //  brickId starts from 1
        require( (brickId = (brickId - 1)) < MAX_BRICK_ID, "HSKESG: Wrong Brick ID");
        uint256 offset = brickId >> 8;
        uint256 mask = 1 << (brickId & 0xFF);
        require( (bricksState[offset] & mask) == 0,  "HSKESG: Brick Occupied");
        bricksState[offset] |= mask;
    }

    function checkBrick(uint256 brickId) external view returns (bool) {         //  brickId starts from 1
        require( (brickId = (brickId - 1)) < MAX_BRICK_ID, "HSKESG: Wrong Brick ID");

        uint256 offset = brickId >> 8;
        uint256 mask = 1 << (brickId & 0xFF);
        return (bricksState[offset] & mask) != 0;
     }
*/
    function setBrick(uint256 brickId, uint256 greenId) internal {                           //  brickId starts from 1
        require( (brickId == 0) || (brickId > MAX_BRICK_ID, "HSKESG: Wrong Brick ID");
        require( greenIdLoc[brickId] == 0,  "HSKESG: Brick Occupied");
        greenIdLoc[brickId] = greenId;

        uint256 offset = brickId >> 4;
        uint256 mask = greenId << (12 * (brickId & 0xF));
        require( (bricksState[offset] & mask) == 0,  "HSKESG: Brick Occupied");
        bricksState[offset] |= mask;
    }

    function ownerBrick(uint256 brickId) external view returns (address owner, uint256 greenId) {
        require( (brickId != 0) || (brickId <= MAX_BRICK_ID), "HSKESG: Wrong Brick ID");
        return greenIdLoc[brickId];
     }

    /**
     * @dev update the maximum REC number to green BTC block
     * @param amountREC type of the managing account
     */
    function setRECAmount(uint256 amountREC) external onlyOwner {
        maxRECToGreenBTC = amountREC;
    }

    function approveBuilder(address[] memory tokens) external onlyOwner {
        require(arkreenBuilder != address(0), "HSKESG: No Builder");
        for(uint256 i = 0; i < tokens.length; i++) {
            TransferHelper.safeApprove(tokens[i], arkreenBuilder, type(uint256).max);
        }
    }       

    /** 
     * @dev Change the BaseURI
     */
    function setBaseURI(string memory newBaseURI) external virtual onlyOwner {
        baseURI = newBaseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev Hook that is called before any token transfer. Miner Info is checked as the following rules:  
     * A) Game miner cannot be transferred
     * B) Only miner in Normal state can be transferred
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override (ERC721EnumerableUpgradeable) {
        require(from == address(0), 'ARB: Transfer Not Allowed');
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function locked(uint256 tokenId) external view returns (bool){
        require((tokenId > 0) && (tokenId <= totalSupply()), 'ARB: Wrong tokenId');
        return true;  
    }
}
