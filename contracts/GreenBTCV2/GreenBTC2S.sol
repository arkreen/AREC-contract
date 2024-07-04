// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/IkWhToken.sol";
import "../libraries/DecimalMath.sol";
import "../libraries/BytesLib.sol";

contract GreenBTC2S is 
    ContextUpgradeable,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    using BytesLib for bytes;

    enum ShotStatus {
        Normal,             // 0
        NotFound,           // 1
        Overtimed,          // 2
        NotReady,           // 3
        WrongHash           // 4
    }

    address public kWhToken;
    uint256 public actionNumber;

    // domains struct in bytes32: 
    // x: MSB0:1; y: MSB1:1; w: MSB2:1; h: MSB3:1; boxTop:MSB4:4
    // chance1: MSB8:2; chance10: MSB10:2; chance3: MSB12:2; chance4: MSB14:2
    // ratio1: MSB16:2; ratio1: MSB18:2; ratio1: MSB20:2; ratio1: MSB22:2
    // decimal:MSB24:1, reserved: MSB25:3, boxGreened: MSB28:4; 
    mapping (uint256 => bytes32) public domains;

    // blockHeight: MSB0:4; domainId: MSB4:2; boxStart: MSB6:4; boxAmount: MSB10: 2; Owner address: MSB12:20
    mapping (uint256 => bytes32)  public greenActions;

    mapping (address => bytes)  internal userActionIDs;     // Mapping from user address to acctionIds stored in bytes
    mapping (uint256 => bytes)  internal domainActionIDs;   // Mapping from domainId to acctionIds stored in bytes

    event DomainRegistered(uint256 domainID, bytes32 domainInfo);
    event DomainGreenized(address gbtcActor, uint256 actionNumber, uint256 blockHeight, uint256 domainID, uint256 boxStart, uint256 boxNumber);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address kWh)
        external
        virtual
        initializer
    {
        __UUPSUpgradeable_init();
        __Ownable_init_unchained();
        kWhToken        = kWh;
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    function convertRatio(uint16 chance) internal pure returns (uint16) {
        return  uint16((65536 * uint256(chance) + 5000) / 10000); 
    }

    /**
     * @dev Register a new domain
     * @param domainID the ID of the domain to be registered
     * @param domainInfo config info of the domain, formated as: 
     *  x: B0:1; y: B1:1; w: B2:1; h: B3:1; (x,y,w,h) define the position of the domain in map, 1 unit = 16 blocks
     *  boxCap: B5:3, the box cap of the domain
     *  chance1: B8:2; chance2: B10:2; chance3: B12:2; chance4: B14:2, the chance of the prize without lock , 500 means 5% 
     *  ratio1: B16:2; ratio1: B18:2; ratio1: B20:2; ratio1: B22:2, the chance of the prize with lock, 1500 means 15% 
     *  decimal:MSB24:1, how much kWh token for 1 box, the exponent of power; reserved: MSB25:7
     *  domainInfo is saved in converted format
     */
    function registerDomain (uint256 domainID, bytes32 domainInfo) public onlyOwner {
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

    function makeGreenBox (uint256 domainID, uint256 boxSteps) public {
        // boxSteps cannot be too big, boxSteps = 10000 will use more than 10,000,000 GWei for checkIfShot
        require ((domainID < 0x10000) && (boxSteps <= 10000), "GBC2: Over Limit");   

        uint256 domainInfo = uint256(domains[domainID]);
        require ( domainInfo != 0 , "GBC2: Empty Domain");

        uint256 boxTop = uint32(domainInfo >> 192);
        uint8 decimalStep = uint8(domainInfo >> 56) & 0x0F;        // decimal use  4 bits

        uint256 boxMadeGreen = uint32(uint256(domains[domainID]));

        require (boxMadeGreen < boxTop, "GBC2: All Greenized");

        boxTop = boxTop - boxMadeGreen;
        if (boxTop < boxSteps) boxSteps = boxTop;                 // if pass the limit, only offset the most available

        uint256 actionID = actionNumber + 1;
        actionNumber = actionID;

        // blockHeight: MSB0:4; domainId: MSB4:2; boxStart: MSB6:4; boxAmount: MSB10: 2
        bytes32 actionValue = bytes32((uint256(uint32(block.number)) << 224) 
                            + (uint256(uint16(domainID)) << 208) + uint256(boxMadeGreen << 176) 
                            + (uint256(uint16(boxSteps)) << 160) + uint256(uint160(msg.sender)));
        greenActions[actionID] = actionValue;

        userActionIDs[msg.sender] = bytes.concat(userActionIDs[msg.sender], bytes4(uint32(actionID)));
        domainActionIDs[domainID] = bytes.concat(domainActionIDs[domainID], bytes4(uint32(actionID)));

        domains[domainID] = bytes32(((domainInfo >> 32) << 32) + (boxMadeGreen + boxSteps));

        emit DomainGreenized(msg.sender, actionID, block.number, domainID, boxMadeGreen, boxSteps);

        uint256 kWhAmount = boxSteps * DecimalMath.getDecimalPower(decimalStep);     // convert to kWh
        IkWhToken(kWhToken).burnFrom(msg.sender, kWhAmount);
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
     * @return domainID domainID of the acion
     * @return counters offset of the green box IDs in the wonList, an array with length of 8
     * @return wonList the lucky green box IDs list, whose length is always counters[7]
     */
    function checkIfShot (address user, uint256 actionId, bytes32 hash) external view 
            returns ( uint256 actionID,
                      uint256 actionResult,
                      uint256 blockHeight,
                      uint256 domainID,
                      uint16[] memory counters,
                      uint32[] memory wonList
                    ) {
                        
        actionID = actionId;
        if (actionID == 0) {                                            // use last action id if not provided
            bytes storage actionIds = userActionIDs[user];              
            if (actionIds.length == 0){ 
                actionID = 0; 
            } else {
                uint256 index = actionIds.length - 4 ;
                actionID = (uint256(uint8(actionIds[index])) << 24) + (uint256(uint8(actionIds[index+1])) << 16) +
                                (uint256(uint8(actionIds[index+2])) << 8) + (uint256(uint8(actionIds[index+3])));
            }
        }
           
        uint256 actionInfo = uint256(greenActions[actionID]);
        blockHeight = actionInfo >> 224;                                // block height of the green action
        domainID = uint16(actionInfo >> 208);

        actionResult = uint256(ShotStatus.Normal);
        if (blockHeight == 0) {
            actionResult = uint256(ShotStatus.NotFound);                            // no given green action
        } else if (block.number <= (blockHeight + 3)) {
            // waiting 3 blocks to protect againt blockchain is forked. Less than is possible if a node is lagged
            actionResult = uint256(ShotStatus.NotReady);                            // not ready
        } else if ((block.number > (blockHeight + 256)) && (uint256(hash) == 0)) {
            actionResult = uint256(ShotStatus.Overtimed);                           // overtimed                    
        } else {
            if (block.number <= (blockHeight + 256)) {
                if ((uint256(hash) != 0) && (hash != blockhash(blockHeight))) {
                    actionResult = uint256(ShotStatus.WrongHash);                   // not ready
                }    
                hash = blockhash(blockHeight); 
            }

            actionInfo = (actionID << 224) + ((actionInfo << 32) >> 32);            // replace blockHeight with actionID
            (counters, wonList) = CalculateGifts(actionInfo, hash);
        }            

        return (actionID, actionResult, blockHeight, domainID, counters, wonList);
    }  

    /**
     * @dev Calculate if won the gifts
     * @param actionInfo the actionInfo used in calculation, must be in the correct format:
     *      blockHeight: MSB0:4; domainId: MSB4:2;
     *      boxStart: MSB6:4; boxAmount: MSB10:2; 
     *      Owner address: MSB12:20
     * @return counters offset of the green box IDs in the wonList, an array with length of 8
     * @return wonList the lucky green box IDs list, whose length is always counters[7]
     */
    function CalculateGifts (uint256 actionInfo, bytes32 hash) 
            internal view returns (uint16[] memory, uint32[] memory) 
    {
        uint256 luckyNumber = uint256(keccak256(abi.encodePacked(hash, actionInfo)));

        uint256 domainID = (actionInfo >> 208) & 0xFFFF;
        uint256 boxStart = (actionInfo >> 176) & 0xFFFFFFFF;
        uint256 boxAmount = (actionInfo >> 160) & 0xFFFF;

        uint256 domainInfo = uint256(domains[domainID]);
        uint16 ratioSum = uint16(domainInfo >> 64);                 // total lucky rate 

        uint256 luckyTemp = luckyNumber;

        uint16[] memory rateList = new uint16[](8);                     // prepare luckyRate
        for (uint256 ind = 0; ind < 8; ind++) 
            rateList[ind] = uint16(domainInfo >> (176 - (16 * ind)));

        uint8[] memory result = new uint8[](boxAmount);             // save the gift type of each won box
        uint16[] memory counters = new uint16[](8);                 // save the won number of 8 gift types
        
        for (uint256 index = 0; index < boxAmount; index++) {
            uint16 ration = uint16(luckyTemp);
            if (ration < ratioSum) {
                for (uint256 ind = 0; ind < 8; ind++) {
                    if (ration < rateList[ind] ) {
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
            (totalWon, counters[index]) = (totalWon + counters[index], uint16(totalWon));   // counter become the offset

        uint32[] memory wonList = new uint32[](totalWon);
        for (uint256 index = 0; index < boxAmount; index++) {
            uint256 wonType = result[index];
            if (wonType != 0) {
                uint16 offset = counters[--wonType];                                       // get won offset
                wonList[offset] = uint32(boxStart + index);
                counters[wonType] = offset + 1;                                            // move the offset
            }
        }

        return (counters, wonList);
    }

    /**
     * @dev Get the actionIDs of the user
     * @param user address of the user to get the actionIDs
     *        offset offset of the actionIDs to get, starting from 0, each actionIDs occupies 4 bytes
     *        length number to actionIDs to get starting from offset, if = 0, get all the actionIDs till the end
     * @return totalOfActions total of actionIDs returned.
     * @return actionIds returned actionIDs, each in 4 bytes 
     */
    function getUserActionIDs (address user, uint256 offset, uint256 length) external view 
            returns (uint256, bytes memory) 
    {
        return geActionIDs(userActionIDs[user], offset, length);
    }

    /**
     * @dev Get the actionIDs of specific domainID
     * @param domainID domainID of the domain to get the actionIDs
     *        offset offset of the actionIDs to get, starting from 0, each actionIDs occupies 4 bytes
     *        length number to actionIDs to get starting from offset, if = 0, get all the actionIDs till the end
     * @return totalOfActions total of actionIDs returned.
     * @return actionIds returned actionIDs, each in 4 bytes 
     */
    function getDomainActionIDs (uint256 domainID, uint256 offset, uint256 length) external view 
            returns (uint256, bytes memory) 
    {
        return geActionIDs(domainActionIDs[domainID], offset, length);
    }

    /**
     * @dev Get the actionIDs of from the storage actionID list
    */
    function geActionIDs (bytes storage actionIDs, uint256 offset, uint256 length) internal pure 
            returns (uint256, bytes memory) 
    {
        bytes memory actions = actionIDs;                 // Need to optimized here, gas may be much high
        uint256 totalOfActions = actions.length / 4;

        if (offset > totalOfActions) offset = totalOfActions;
        if (length == 0) length = totalOfActions - offset;
        uint256 start = offset * 4;
        uint256 end = (offset + length) * 4;
        if (end > actions.length) end = actions.length;
        return (totalOfActions, actions.slice(start, end - start));
    }

}
