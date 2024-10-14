// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
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

    struct Sig {
        uint8       v;
        bytes32     r;
        bytes32     s;              
    }

    struct LuckyFundInfo {
        uint96     amountDeposit;
        uint96     amountDroped;
    }

    // keccak256("makeGreenBoxLucky(uint256 domainID,uint256 boxSteps,address greener,uint256 nonce,uint256 deadline)");
    bytes32 public constant LUCKY_TYPEHASH = 0x6A10D25EB5A7B84EB21D26AF2DB8C23A1FB80647769A40DA523EDDCFFC172A10;  

    address public kWhToken;
    address public domainManager;

    uint256 public actionNumber;

    // domains struct in bytes32: 
    // x: MSB0:1; y: MSB1:1; w: MSB2:1; h: MSB3:1; boxTop:MSB4:4
    // chance1: MSB8:2; chance2: MSB10:2; chance3: MSB12:2; chance4: MSB14:2
    // ratio1: MSB16:2; ratio2: MSB18:2; ratio3: MSB20:2; ratio4: MSB22:2
    // decimal:MSB24:1, reserved: MSB25:3, boxGreened: MSB28:4; 
    mapping (uint256 => bytes32) public domains;

    // blockHeight: MSB0:4; domainId: MSB4:2; boxStart: MSB6:4; boxAmount: MSB10: 2; Owner address: MSB12:20
    mapping (uint256 => bytes32)  public greenActions;

    mapping (address => bytes)  internal userActionIDs;     // Mapping from greener address to acctionIds stored in bytes
    mapping (uint256 => bytes)  internal domainActionIDs;   // Mapping from domainId to acctionIds stored in bytes

    bytes32 public _DOMAIN_SEPARATOR;
    mapping(address => uint256) public nonces;              // greener -> nonce
    LuckyFundInfo public luckyFundInfo;
    address public luckyManager;

    event DomainRegistered(uint256 domainID, bytes32 domainInfo);
    event DomainGreenized(address gbtcActor, uint256 actionNumber, uint256 blockHeight, uint256 domainID, uint256 boxStart, uint256 boxNumber);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address kWh, address manager)
        external
        virtual
        initializer
    {
        __UUPSUpgradeable_init();
        __Ownable_init_unchained();
        kWhToken        = kWh;
        domainManager   = manager;
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    function postUpdate() external onlyProxy onlyOwner 
    {
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes("Green BTC Club")),
                keccak256(bytes("2")),
                block.chainid,
                address(this)
            )
        );  
    }

    modifier onlyManager() {
        require((_msgSender() == owner()) || (_msgSender() == domainManager), "GBTC: Not Manager");
        _;
    }

    function setDomainManager(address manager) public onlyOwner {
        require(manager != address(0), "GBTC: Zero Address");
        domainManager = manager;                    
    }

    function setLuckyManager(address manager) public onlyOwner {
        require(manager != address(0), "GBTC: Zero Address");
        luckyManager = manager;                    
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
    function registerDomain (uint256 domainID, bytes32 domainInfo) public onlyManager {
        // require (uint256(domains[domainID]) == 0, "GBC2: Wrong Domain ID");

        uint256 ratioSum;
        uint256 domainInfoSaved; 
        for (uint256 index = 0; index < 8; index++) {
            uint256 ratioPosition = 176 - (index * 16);
            uint256 ratio = uint16(uint256(domainInfo) >> ratioPosition);
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
        uint256 boxMadeGreen = uint32(domainInfo);
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

        userActionIDs[msg.sender].concatStorage(abi.encodePacked(bytes4(uint32(actionID))));
        domainActionIDs[domainID].concatStorage(abi.encodePacked(bytes4(uint32(actionID))));
        domains[domainID] = bytes32(((domainInfo >> 32) << 32) + (boxMadeGreen + boxSteps));

        emit DomainGreenized(msg.sender, actionID, block.number, domainID, boxMadeGreen, boxSteps);

        uint256 kWhAmount = boxSteps * DecimalMath.getDecimalPower(uint8(domainInfo >> 56) & 0x0F);     // convert to kWh
        IkWhToken(kWhToken).burnFrom(msg.sender, kWhAmount);
    }

    function makeGreenBoxLucky (uint256 domainID, uint256 boxSteps, address greener, uint256 nonce, uint256 deadline, Sig calldata signature) public {
        // boxSteps cannot be too big, boxSteps = 10000 will use more than 10,000,000 GWei for checkIfShot
        require ((domainID < 0x10000) && (boxSteps <= 10000), "GBC2: Over Limit");   

        uint256 domainInfo = uint256(domains[domainID]);
        require ( domainInfo != 0 , "GBC2: Empty Domain");
        require (nonce == nonces[greener], "Nonce Not Match"); 

        {
          bytes32 stakeHash = keccak256(abi.encode(LUCKY_TYPEHASH, domainID, boxSteps, greener, nonce, deadline));
          bytes32 digest = keccak256(abi.encodePacked('\x19\x01', _DOMAIN_SEPARATOR, stakeHash));
          address managerAddress = ECDSAUpgradeable.recover(digest, signature.v, signature.r, signature.s);
          require(managerAddress == luckyManager, "Wrong Signature");
        }

        nonces[greener] = nonce + 1;
        uint256 boxTop = uint32(domainInfo >> 192);
        uint256 boxMadeGreen = uint32(uint256(domains[domainID]));
        require (boxMadeGreen < boxTop, "GBC2: All Greenized");

        boxTop = boxTop - boxMadeGreen;
        if (boxTop < boxSteps) boxSteps = boxTop;                 // if pass the limit, only offset the most available

        uint256 actionID = actionNumber + 1;
        actionNumber = actionID;

        // blockHeight: MSB0:4; domainId: MSB4:2; boxStart: MSB6:4; boxAmount: MSB10: 2
        bytes32 actionValue = bytes32((uint256(uint32(block.number)) << 224) 
                            + (uint256(uint16(domainID)) << 208) + uint256(boxMadeGreen << 176) 
                            + (uint256(uint16(boxSteps)) << 160) + uint256(uint160(greener)));
        greenActions[actionID] = actionValue;

        userActionIDs[greener].concatStorage(abi.encodePacked(bytes4(uint32(actionID))));
        domainActionIDs[domainID].concatStorage(abi.encodePacked(bytes4(uint32(actionID))));

        domains[domainID] = bytes32(((domainInfo >> 32) << 32) + (boxMadeGreen + boxSteps));
        emit DomainGreenized(greener, actionID, block.number, domainID, boxMadeGreen, boxSteps);

        uint256 kWhAmount = boxSteps * DecimalMath.getDecimalPower(uint8(domainInfo >> 56) & 0x0F);     // convert to kWh
        IkWhToken(kWhToken).burn(kWhAmount);
    }

    /**
     * @dev Get the actionIDs of the greener
     * @param greener address of the greener to get the actionIDs
     *        offset offset of the actionIDs to get, starting from 0, each actionIDs occupies 4 bytes
     *        length number to actionIDs to get starting from offset, if = 0, get all the actionIDs till the end
     * @return totalOfActions total of actionIDs returned.
     * @return actionIds returned actionIDs, each in 4 bytes 
     */
    function getUserActionIDs (address greener, uint256 offset, uint256 length) external view 
            returns (uint256, bytes memory) 
    {
        return geActionIDs(userActionIDs[greener], offset, length);
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
    function geActionIDs (bytes storage actionIDs, uint256 offset, uint256 length) internal view 
            returns (uint256, bytes memory) 
    {
        uint256 lengthActionIDs = actionIDs.length;
        offset = 4 * offset;
        length = 4 * length;

        if (offset > lengthActionIDs) offset = lengthActionIDs;
        if ((length == 0)  || ((offset + length) > lengthActionIDs)) length = lengthActionIDs - offset;
        return (lengthActionIDs/4, actionIDs.getStorage(offset, length));
    }
}