// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";

import "../libraries/FormattedStrings.sol";
import "../libraries/TransferHelper.sol";

import "../interfaces/IWETH.sol";
import "../interfaces/IGreenBTCImage.sol";
import "../interfaces/IArkreenBuilder.sol";
import "../interfaces/IArkreenRECBank.sol";
import "../interfaces/IArkreenRECToken.sol";
import "../interfaces/IkWhToken.sol";

import "../GreenBTCType.sol";
import "../interfaces/IERC20.sol";
import "../GreenBTCStorage.sol";
import "./GreenBTC2Type.sol";
import "../interfaces/IGreenBTCGift.sol";

// Import this file to use console.log
import "hardhat/console.sol";

contract GreenBTC2 is 
    ContextUpgradeable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC1155Upgradeable,
    ERC1155BurnableUpgradeable,
    GreenBTCStorage
{

    using Strings for uint256;
    using Strings for address;
    using FormattedStrings for uint256;

    enum ShotStatus {
        Normal,             // 0
        Claimed,            // 1
        Overtimed,          // 2
        NotReady            // 3
    }

    // keccak256("GreenBTC2(uint256 height,bytes32 hash)");
    bytes32 public constant GREENBTC2_HASH = 0xC06BCEF3A0C6ADEEA66203210D224C78DCC6461AC236D0B3451FC8707E963A22;  

    address public kWhToken;
    address public greenBTCGift;
    address public claimManager;

    uint256 public actionNumber;

    // domains struct in bytes32: 
    // x: MSB0:1; y: MSB1:1; w: MSB2:1; h: MSB3:1; boxTop:MSB4:4
    // chance1: MSB8:2; chance10: MSB10:2; chance3: MSB12:2; chance4: MSB14:2
    // ratio1: MSB16:2; ratio1: MSB18:2; ratio1: MSB20:2; ratio1: MSB22:2
    // GiftID: MSB24:8, giftID corresponding to chance1-4 and ratio1-4
    mapping (uint256 => bytes32)  public domains;

    // boxRedeemed: MSB0:4; 
    // won1: MSB8:3; won2: MSB11:3; won3: MSB14:3; won4: MSB17:3
    // shot1: MSB20:3; shot2: MSB23:3; shot3: MSB26:3; shot4: MSB29:3
    mapping (uint256 => bytes32)  public domainStatus;

    // blockHeight: MSB0:4; 
    // domainId: MSB4:2;  msb is the flag indicating if claimed
    // boxStart: MSB6:3; boxAmount: MSB9: 3
    //      Unclaimed: Owner address: MSB12:20
    //      Claimed:
    //          won1: MSB12:2; won2: MSB14:2; won3: MSB16:2; won4: MSB18:2
    //          shot1: MSB20:2; shot2: MSB22:2; shot3: MSB24:2; shot4: MSB26:2
    //          claimed: MSB30:2
    mapping (uint256 => bytes32)  public greenActions;

    mapping (address => bytes)  public userActionIDs;     // Mapping from user address to acctionIds stored in bytes
    mapping (uint256 => bytes)  public domainActionIDs;   // Mapping from domainId to acctionIds stored in bytes

    mapping (uint256 => uint256)  public blockHash;     // Mapping from block height to block hash

    event ClaimedActionGifts(address indexed gbtcActor, uint256 actionID, uint256 height, bytes32 hash, uint256[] giftIDs, uint256[] amounts);
    event DomainRegistered(uint256 domainID, bytes32 domainInfo);
    event DomainGreenized(address gbtcActor, uint256 actionNumber, uint256 blockHeight, uint256 domainID, uint256 boxStart, uint256 boxNumber);
    event FundDeposit(address fundToken, uint256 fundAmount);

    // event Subsidy(uint256 height, uint256 ratio);

    modifier ensure(uint256 deadline) {
        require(uint32(deadline) >= block.timestamp, "GBTC: EXPIRED");
        _;
    }

    modifier onlyManager(){
        require(msg.sender == claimManager, "GBTC: Not Manager");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    //initialize
    //function initialize(address authority, address builder, address cART, address native)
    function initialize(address kWh, address manager)
        external
        virtual
        initializer
    {
        __UUPSUpgradeable_init();
        __Ownable_init_unchained();
        __ERC1155_init_unchained("");
        __ERC1155Burnable_init_unchained();

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Green BTC Club")),
                keccak256(bytes("2")),
                block.chainid,
                address(this)
            )
        );  

        kWhToken        = kWh;
        claimManager    = manager;
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    function convertRatio(uint16 chance) internal pure returns (uint16) {
        return  uint16((65536 * uint256(chance) + 5000) / 10000); 
    }

    function setGreenBTCGift(address gift) public onlyOwner {
        require(gift != address(0), "GBTC: Zero Address");
        greenBTCGift = gift;
    }

    /**
     * @dev Approve the tokens which can be transferred from this GreenBTC contract by arkreenBuilder
     * @param tokens The token list
     */
    function approveGift(address[] calldata tokens) public onlyOwner {
        require(greenBTCGift != address(0), "GBTC: No Gift");
        for(uint256 i = 0; i < tokens.length; i++) {
            TransferHelper.safeApprove(tokens[i], greenBTCGift, type(uint256).max);
        }
    }

    /**
     * @dev Deposit various fund tokens to green BTC club 2
     * @param fundToken Token address of the ART to deposit. 
     * @param fundAmount Amount of the fund to deposit.
     */
    function depositFund(address fundToken, uint256 fundAmount) external {
        TransferHelper.safeTransferFrom(fundToken, msg.sender, address(this), fundAmount);
        emit FundDeposit(fundToken, fundAmount);
    }  

    /**
     * @dev Register a new domain
     * @param domainID the ID of the domain to be registered
     * @param domainInfo config info of the domain, formated as: 
     *  x: B0:1; y: B1:1; w: B2:1; h: B3:1; (x,y,w,h) define the position of the domain in map, 1 unit = 16 blocks
     *  boxCap: B4:4, the box cap of the domain
     *  chance1: B8:2; chance2: B10:2; chance3: B12:2; chance4: B14:2, the chance of the prize without lock , 500 means 5% 
     *  ratio1: B16:2; ratio1: B18:2; ratio1: B20:2; ratio1: B22:2, the chance of the prize with lock, 1500 means 15% 
     *  reserve: B24:8; not used 
     *  domainInfo is saved in converted format
     */
    function registerDomain (uint256 domainID, bytes32 domainInfo) public {
        require (uint256(domains[domainID]) == 0, "GBC2: Wrong Domain ID");

        uint256 ratioSum;
        uint256 domainInfoSaved; 
        for (uint256 index = 0; index < 8; index++) {
            uint256 ratioPosition = 176 - (index * 16);
            uint256 ratio = convertRatio(uint16(uint256(domainInfo) >> ratioPosition));
            ratioSum += ratio;
            domainInfoSaved += (ratioSum << ratioPosition);
        }
        require (ratioSum < 65536, "GBC2: Wrong Chance");

        domainInfoSaved += ((uint256(domainInfo) >> 192) << 192);
        domainInfoSaved += uint64(uint256(domainInfo));
        domains[domainID] = bytes32(domainInfoSaved);
        emit DomainRegistered(domainID, domainInfo);
    }

    function getDomain (uint256 domainID) public view returns (bytes32 domainInfo) {
        domainInfo = domains[domainID];
    }

    function getDomainBoxTop (uint256 domainID) public view returns (uint256) {
        uint256 domainInfo = uint256(domains[domainID]);
        return uint256(domainInfo >> 192) & 0xFFFFFFFF;
    }

    function getDomainBoxMadeGreen (uint256 domainID) public view returns (uint256) {
        uint256 status = uint256(domainStatus[domainID]);
        return status >> 224;
    }

    function setDomainBoxMadeGreen (uint256 domainID, uint256 boxMadeGreen) internal {
        uint256 status = uint256(domainStatus[domainID]);
        domainStatus[domainID] = bytes32(((status << 32) >> 32) + (boxMadeGreen << 224));
    }

    function makeGreenBox (uint256 domainID, uint256 boxSteps) public {
        require ((domainID < 0x7FFF) && (boxSteps < 0x1000000), "GBC2: Over Limit");

        uint256 boxTop = getDomainBoxTop(domainID);
        uint256 boxMadeGreen = getDomainBoxMadeGreen(domainID);

        require (boxMadeGreen < boxTop, "GBC2: All Greenized");

        boxTop = boxTop - boxMadeGreen;
        if (boxTop < boxSteps) boxSteps = boxTop;

        uint256 kWhAmount = boxSteps * 1e8;     // convert to kWh

        //console.log('AAAAAAAAAAAA', boxMadeGreen, boxSteps, kWhAmount);

        IkWhToken(kWhToken).burnFrom(msg.sender, kWhAmount);

        actionNumber = actionNumber + 1;

        // blockHeight: MSB0:4; domainId: MSB4:2; boxStart: MSB6:3; boxAmount: MSB9: 3
        bytes32 actionValue = bytes32((uint256(uint32(block.number)) << 224) 
                            + (uint256(uint16(domainID)) << 208) + (uint256(uint32(boxMadeGreen)) << 184) 
                            + (uint256(uint32(boxSteps)) << 160) + uint256(uint160(msg.sender)));
        greenActions[actionNumber] = actionValue;

        userActionIDs[msg.sender] = bytes.concat(userActionIDs[msg.sender], bytes4(uint32(actionNumber)));
        domainActionIDs[domainID] = bytes.concat(domainActionIDs[domainID], bytes4(uint32(actionNumber)));

        setDomainBoxMadeGreen(domainID, boxMadeGreen + boxSteps);

        //console.logBytes32(actionValue);
        //console.logBytes(userActionIDs[msg.sender]);
        //console.logBytes(domainActionIDs[domainID]);

        emit DomainGreenized(msg.sender, actionNumber, block.number, domainID, boxMadeGreen, boxSteps);
    }

    /**
     * @dev Check the green action lucky result of a given user and the given green action
     * @param user address of the user, if the acion pointered by actionID is not claimed, the 'user' can be optional
     * @param actionID ID of the green action to be checked. = 0, check last action; others, unique green action ID of the actiom
     * @param hash Hash value of the block containing the action
     * @return actionID action ID of the action, same as the input if it is non-zero, otherwise it is the user's last action.
     * @return actionResult the result of the checking:
     *                      0: Normal, the action has not been claimed, all action lucky result returned
     *                      1: Claimed, the action has been claimed, all action lucky result returned
     *                      2: Overtimed, all action lucky result not available as the 256 blocks passed
     *                      3: Not Ready, too early to reveal the result, all action lucky result not available
     * @return blockHeight the block height on which the green action located
     * @return counters offset of the green box IDs in the wonList, an array with length of 8
     * @return wonList the lucky green box IDs list, whose length is always counters[7]
     */
    function checkIfShot (address user, uint256 actionID, bytes32 hash) public view 
            returns (uint256, uint256, uint256, uint24[] memory, uint24[] memory) {

        if (actionID == 0) {                                            // use last action id if not provided
            bytes storage actionIds = userActionIDs[user];              // assume user is given here
            uint256 index = actionIds.length - 4 ;
            actionID = (uint256(uint8(actionIds[index])) << 24) + (uint256(uint8(actionIds[index+1])) << 16) +
                            (uint256(uint8(actionIds[index+2])) << 8) + (uint256(uint8(actionIds[index+3])));
        }
           
        uint256 actionInfo = uint256(greenActions[actionID]);
        uint256 blockHeight = actionInfo >> 224;                        // block height of the green action
        uint256 domainID = (actionInfo >> 208) & 0xFFFF;

        uint24[] memory wonList;
        uint24[] memory counters;
        uint256 actionResult = uint256(ShotStatus.Normal);
        if (blockHeight == 0) {
            actionResult = uint256(0xFF);                               // no given green action
        } else if (domainID >= 0x8000) {
            actionResult = uint256(ShotStatus.Claimed);                 // already claimed.
            if ((user == address(0)) || (uint256(hash) == 0)) {         // return stored won info
                counters = new uint24[](8);
                for (uint256 index = 0; index < 8; index++) {
                    counters[index] = uint24(actionInfo >> (144 - (16 * index)));
                }
            } else {
                actionInfo = (actionID << 224) + ((actionInfo << 4) >> 4);          // replace blockHeight with actionID
                actionInfo = ((actionInfo >> 160) << 160) + uint256(uint160(user)); // merge user address
                actionInfo ^= (1 << 223);                                           // clear "Claimed" flag
                (counters, wonList) = CalculateGifts(actionInfo, hash);             // hash must be correct, otherwise get wrong result
            }
        } else {
            // waiting 3 blocks to protect againt blockchain is forked. Less than is possible if a node is lagged
            if (block.number <= (blockHeight + 3)) {
                actionResult = uint256(ShotStatus.NotReady);                        // not ready
            } else {
                if ((block.number > (blockHeight+256)) && (uint256(hash) == 0)) {
                    actionResult = uint256(ShotStatus.Overtimed);                   // overtimed                    
                } else {
                    actionInfo = (actionID << 224) + ((actionInfo << 4) >> 4);      // replace blockHeight with actionID
                    if (block.number <= (blockHeight+256)) hash = blockhash(blockHeight); 
                    (counters, wonList) = CalculateGifts(actionInfo, hash);
                }
            }            
        }

        return (actionID, actionResult, blockHeight, counters, wonList);
    }  

    /**
     * @dev Calculate if won the gifts
     * @param actionInfo the actionInfo used in calculation, must be in the correct format:
     *      blockHeight: MSB0:4; domainId: MSB4:2, msb (Claimed Flag) must be cleared
     *      boxStart: MSB6:3; boxAmount: MSB9:3; Owner address: MSB12:20
     * @return counters offset of the green box IDs in the wonList, an array with length of 8
     * @return wonList the lucky green box IDs list, whose length is always counters[7]
     */
    function CalculateGifts (uint256 actionInfo, bytes32 hash) 
            internal view returns (uint24[] memory, uint24[] memory) 
    {
        uint256 luckyNumber = uint256(keccak256(abi.encodePacked(hash, actionInfo)));

        uint256 domainID = (actionInfo >> 208) & 0xFFFF;
        uint256 boxStart = (actionInfo >> 184) & 0xFFFFFF;
        uint256 boxAmount = (actionInfo >> 160) & 0xFFFFFF;

        uint256 domainInfo = uint256(domains[domainID]);
        uint16 ratioSum = uint16(domainInfo >> 64);                 // total lucky rate 

        uint256 luckyTemp = luckyNumber;

        uint8[] memory result = new uint8[](boxAmount);             // save the gift type of each won box
        uint24[] memory counters = new uint24[](8);                 // save the won number of 8 gift types
        
        for (uint256 index = 0; index < boxAmount; index++) {
            uint16 ration = uint16(luckyTemp);
            if (ration < ratioSum) {
                for (uint256 ind = 0; ind < 8; ind++) {
                    if (ration < uint16(domainInfo >> (176 - (16 * ind)))) {
                        result[index] = uint8(ind + 1); 
                        counters[ind] += 1;
                        break;
                    }
                }
            }

            if ((index & 0x0F) == 0x0F) {
                luckyNumber = uint256(keccak256(abi.encodePacked(luckyNumber)));
                luckyTemp = luckyNumber;
            } else {
                luckyTemp = (luckyTemp >> 16);
            }
        }

        uint256 totalWon = 0;
        for (uint256 index = 0; index < 8; index++)
            (totalWon, counters[index]) = (totalWon + counters[index], uint24(totalWon));   // counter become the offset

        uint24[] memory wonList = new uint24[](totalWon);
        for (uint256 index = 0; index < boxAmount; index++) {
            uint256 wonType = result[index];
            if (wonType != 0) {
                uint24 offset = counters[--wonType];                                       // get won offset
                wonList[offset] = uint24(boxStart + index);
                counters[wonType] = offset + 1;                                            // move the offset
            }
        }

        return (counters, wonList);
    }

    function claimActionGifts (uint256 actionID, uint256 height,  bytes32 hash, Sig calldata signature) public {
        uint256 actionInfo = uint256(greenActions[actionID]);

        {   // Tricky to solve stack too deep problem
            require (height == (actionInfo >> 224), "GBC2: Wrong Block Height");    // check block height is same

            bytes32 claimHash = keccak256(abi.encode(GREENBTC2_HASH, height, hash));
            bytes32 digest = keccak256(abi.encodePacked('\x19\x01', DOMAIN_SEPARATOR, claimHash));
            address manager = ECDSAUpgradeable.recover(digest, signature.v, signature.r, signature.s);

            require (manager == claimManager, "Wrong Signature");
        }

        (, uint256 actionResult, , uint24[] memory counters,) = checkIfShot(address(0), actionID, hash);    

        //console.log('HHHHHHHHHHHHHHHHHHHH', actionResult, actionID);
        //console.logBytes32(hash);

        if (actionResult != uint256(ShotStatus.Normal)) {
            if (actionResult == uint256(0xFF)) revert ("GBC2: Wrong Action ID");
            if (actionResult == uint256(ShotStatus.Claimed)) revert ("GBC2: Action Claimed");
            if (actionResult == uint256(ShotStatus.NotReady)) revert ("GBC2: Claim Early");
        }

        uint256 wonResult = 0;                                                              // Save action wonResult
        uint24[] memory wontimes = new uint24[](8);
        uint256 wonCounter = 0;                                                             // won giftID counter

        for (uint256 index = 0; index < 8; index++) { 
            wontimes[index] = (index == 0) ? counters[index] : (counters[index] - counters[index - 1]);
            require(wontimes[index] <= 0xFFFF);
            wonResult = (wonResult << (index * 16)) + wontimes[index];         // !!!! Assuming wontimes less than uint16 here !!!!
            if (wontimes[index] != 0) wonCounter++;
        }

        address actionOwner = address(uint160(actionInfo));
        actionInfo = ((actionInfo >> 160) << 160) + (wonResult << 32) + (1 << 223);         // Merge the wonResult and set "Claimed" flag
        greenActions[actionID] = bytes32(actionInfo);                                       // Saved on chain as proof

        uint256[] memory giftIDs;
        uint256[] memory amounts;

        if (wonCounter > 0) {
            uint256 domainInfo = uint256(domains[(actionInfo >> 208) & 0x7FFF]);            // Skip "Claimed" flag

            giftIDs = new uint256[](wonCounter);
            amounts = new uint256[](wonCounter);
            uint256 giftIndex;
            for (uint256 index = 0; index < 8; index++) { 
                if (wontimes[index] != 0) {
                    giftIDs[giftIndex] = uint256(uint8(domainInfo >> ((7-index) * 8)));
                    amounts[giftIndex] = wontimes[index];
                    giftIndex++;
                }
            }

            IGreenBTCGift(greenBTCGift).mintGifts(actionOwner, giftIDs, amounts);
        }

      	emit ClaimedActionGifts(actionOwner, actionID, height, hash, giftIDs, amounts);
    }
}
