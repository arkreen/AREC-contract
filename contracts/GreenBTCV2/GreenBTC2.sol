// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
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
import "../GreenBTCType.sol";
import "../interfaces/IERC20.sol";
import "../GreenBTCStorage.sol";
import "./GreenBTC2Type.sol";

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

    // domains struct in bytes32: 
    // x: MSB0:1; y: MSB1:1; w: MSB2:1; h: MSB3:1; boxTop:MSB4:4
    // chance1: MSB8:2; chance10: MSB10:2; chance3: MSB12:2; chance4: MSB14:2
    // ratio1: MSB16:2; ratio1: MSB18:2; ratio1: MSB20:2; ratio1: MSB22:2
    // empty: MSB24:6; allchance: MSB30:2
    mapping (uint256 => bytes32)  public domains;

    // boxRedeemed: MSB0:4; 
    // won1: MSB8:3; won2: MSB11:3; won3: MSB14:3; won4: MSB17:3
    // shot1: MSB20:3; shot2: MSB23:3; shot3: MSB26:3; shot4: MSB29:3
    mapping (uint256 => bytes32)  public domainStatus;

    // blockHeight: MSB0:4; domainId: MSB4:2; boxStart: MSB6:4; boxAmount: MSB10: 4
    // won1: MSB14:2; won2: MSB16:2; won3: MSB18:2; won4: MSB20:2
    // shot1: MSB22:2; shot2: MSB24:2; shot3: MSB26:2; shot4: MSB28:2
    // claimed: MSB30:2
    mapping (uint256 => bytes32)  public actions;


    mapping (address => bytes)  public userActions;     // Mapping from user address to acctionIds stored in bytes
    mapping (uint256 => bytes)  public domainActions;   // Mapping from domainId to acctionIds stored in bytes

    mapping (uint256 => uint256)  public blockHash;     // Mapping from block height to block hash

    uint256 public actionNumber;

    event GreenBitCoin(uint256 height, uint256 ARTCount, address minter, uint8 greenType);
    event OpenBox(address opener, uint256 tokenID, uint256 blockNumber);
    event RevealBoxes(uint256[] revealList, bool[] wonList);

    event DomainGreenized(address gbtcActor, uint256 actionNumber, uint256 blockHeight, uint256 domainID, uint256 boxStart, uint256 boxNumber);

    // event Subsidy(uint256 height, uint256 ratio);

    modifier ensure(uint256 deadline) {
        require(uint32(deadline) >= block.timestamp, "GBTC: EXPIRED");
        _;
    }

    modifier onlyManager(){
        require(msg.sender == manager, "GBTC: Not Manager");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    //initialize
    //function initialize(address authority, address builder, address cART, address native)
    function initialize()
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
                keccak256(bytes(NAME)),
                keccak256(bytes(VERSION)),
                block.chainid,
                address(this)
            )
        );  

        manager         = owner();
//        authorizer      = authority;
//        arkreenBuilder  = builder;
//        tokenCART       = cART;
//        tokenNative     = native;
//        luckyRate       = 5;
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    function registerDomain (uint256 domainID, bytes32 domainInfo) public {
        require (domainInfo.length >= 32, "GBC2: Wrong DomainInfo");

        uint256 sum;
        uint256 mask = type(uint256).max - 0xFFFF;
        {
            assembly {
                domainInfo := and(domainInfo, mask)           // clear least 2 bytes

                sum := add(sum, shr(64, domainInfo))
                sum := add(sum, shr(80, domainInfo))
                sum := add(sum, shr(96, domainInfo))
                sum := add(sum, shr(112, domainInfo))
                sum := add(sum, shr(128, domainInfo))
                sum := add(sum, shr(144, domainInfo))
                sum := add(sum, shr(160, domainInfo))
                sum := add(sum, shr(176, domainInfo))
                sum := and(sum, 0xFFFF)                       // should be less than 10000 
            }
        }
        domains[domainID] = bytes32(uint256(domainInfo) + sum);
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

        uint256 boxTop = getDomainBoxTop(domainID);
        uint256 boxMadeGreen = getDomainBoxMadeGreen(domainID);

        require (boxMadeGreen < boxTop, "GBC2: All Greenized");

        boxTop = boxTop - boxMadeGreen;
        if (boxTop < boxSteps) boxSteps = boxTop;

        uint256 kWhAmount = boxSteps * 1e8;     // convert to kWh

        actionNumber = actionNumber + 1;

        // blockHeight: MSB0:4; domainId: MSB4:2; boxStart: MSB6:4; boxAmount: MSB10: 4
        bytes32 actionValue = bytes32((uint256(uint32(block.number)) << 224) 
                            + (uint256(uint16(domainID)) << 208) + (uint256(uint32(boxMadeGreen)) << 176) 
                            + (uint256(uint32(boxSteps)) << 144));
        actions[actionNumber] = actionValue;

        userActions[msg.sender] = bytes.concat(userActions[msg.sender], bytes4(uint32(actionNumber)));
        domainActions[domainID] = bytes.concat(domainActions[domainID], bytes4(uint32(actionNumber)));

        setDomainBoxMadeGreen(domainID, boxMadeGreen + boxSteps);

        console.logBytes32(actionValue);
        console.logBytes(userActions[msg.sender]);
        console.logBytes(domainActions[domainID]);

        emit DomainGreenized(msg.sender, actionNumber, block.number, domainID, boxMadeGreen, boxSteps);
    }


}
