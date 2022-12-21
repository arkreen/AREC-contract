// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import './ArkreenBadgeStorage.sol';
import "./interfaces/IPausable.sol";
import "./interfaces/IArkreenRegistry.sol";
import "./interfaces/IArkreenRECIssuance.sol";
import "./interfaces/IERC5192.sol";

// Import this file to use console.log
import "hardhat/console.sol";

contract ArkreenBadge is
    OwnableUpgradeable,
    UUPSUpgradeable,
    ERC721EnumerableUpgradeable,
    IERC721Receiver,
    ArkreenBadgeStorage,
    IERC5192
{
    using AddressUpgradeable for address;

    // Public variables
    string public constant NAME = 'Arkreen REC Badge';
    string public constant SYMBOL = 'ARB';

     // Events
    event ArkreenRegistryUpdated(address newArkreenRegistry);
    event OffsetCertificateMinted(uint256 tokenId);
    event OffsetCertificateUpdated(uint256 tokenId);

    // Modifiers
    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'ARB: EXPIRED');
        _;
    }
  
    modifier whenNotPaused() {
        require(!IPausable(arkreenRegistry).paused(), 'ARB: Paused');
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address arkRegistry) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();        
        __ERC721_init_unchained(NAME, SYMBOL);
        arkreenRegistry = arkRegistry;
        baseURI = 'https://www.arkreen.com/badge/' ;

        address owner = _msgSender();
        assembly {
            sstore(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103, owner)
        }          
    }   

    function postUpdate() external onlyProxy onlyOwner 
    {}

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}

    /** 
     * @dev Update the arkreenRegistry contract address.
     */
    function updateArkreenRegistry(address _address) external virtual onlyOwner {
        arkreenRegistry = _address;
        emit ArkreenRegistryUpdated(_address);
    }

    /** 
     * @dev Change the minimum offset amount 
     */
    function setMinOffsetAmount(uint256 amount) external virtual onlyOwner {
        minOffsetAmount = uint128(amount);
    }

    /** 
     * @dev To register offset actions so that they can be linked to an offset certificate NFT.
     * Can only be called from the REC token contract, or from the REC issuance contrarct
     * @param offsetEntity The entity that is offsetting the renewable energy.
     * @param issuerREC The address of the REC issuer.
     * @param amount The amount of the RE that is offset.
     */
    function registerOffset(
        address offsetEntity,
        address issuerREC,
        uint256 amount,
        uint256 tokenId
    ) external returns (uint256) {
        bool isRECIssuance = (msg.sender == IArkreenRegistry(arkreenRegistry).getRECIssuance());
        bool isZeroTokenId = (tokenId == 0);

        // Check called from the REC token contract, or from the REC issuance contrarct
        require( isRECIssuance || msg.sender == IArkreenRegistry(arkreenRegistry).getRECToken(issuerREC), 
                    'ARB: Wrong Issuer');

        // TokenId should not be zero for RECIssuance, and should be zero for RECToken
        require(isRECIssuance != isZeroTokenId, 'ARB: Wrong TokenId');      

        // Check the minimum offset amount
        require( amount >= minOffsetAmount, 'ARB: Less Amount');

        uint256 offsetId = offsetCounter + 1;
        offsetCounter = offsetId;

        OffsetAction memory offsetAction = OffsetAction(offsetEntity, issuerREC, uint128(amount), uint64(tokenId),
                                                        uint56(block.timestamp), false);
        offsetActions[offsetId] = offsetAction;

        // Add offset ID to the user
        userActions[offsetEntity].push(offsetId);
        totalOffsetRegistered += amount;

        return offsetId;
    }

    /**
     * @dev Attach new offset action ids to an existing NFT.
     * @param tokenId Id of the NFT to attach offset actions to.
     * @param offsetIds List of offset action ids to link with the NFT.
     */
    function attachOffsetEvents(
        uint256 tokenId,
        uint256[] calldata offsetIds
    ) external {
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender == tokenOwner, 'ARB: Not Owner');
        require(block.timestamp < (certificates[tokenId].creationTime + 3 days), 'ARB: Time Elapsed');        

        uint256 offsetAmount =_attachOffsetEvents(tokenId, tokenOwner, offsetIds);
        certificates[tokenId].offsetTotalAmount += offsetAmount;

        // Accumulate the total retired offset amount
        totalOffsetRetired += offsetAmount;
    }    

    /**
     * @dev Attach offset actions to an NFT
     * @param tokenId Id of the NFT to attach offset actions to
     * @param offsetEntity Entity that is attaching offset actions
     * @param offsetIds List of offset action ids to attach
     */
    function _attachOffsetEvents(
        uint256 tokenId,
        address offsetEntity,
        uint256[] calldata offsetIds
    ) internal returns(uint256) {
        // List should not be empty
        require(offsetIds.length != 0, 'ARB Empty List');

        //slither-disable-next-line uninitialized-local
        uint256 offsetAmount;

        //slither-disable-next-line uninitialized-local
        for (uint256 i; i < offsetIds.length; i++) {
            uint256 offsetId = offsetIds[i];

            // Check entity is identical
            require(offsetActions[offsetId].offsetEntity == offsetEntity, 'ARB: Wrong Enity');

            // Should not be attached
            require(!offsetActions[offsetId].bClaimed, 'ARB: Already Claimed');
            offsetActions[offsetId].bClaimed = true;

            certificates[tokenId].offsetIds.push(offsetId);
            offsetAmount += uint256(offsetActions[offsetId].amount);
        }
        
        return offsetAmount;
    }    

    /**
     * @dev Mint new RET Offset Certificate NFT which contains how much renewable energy are offset.
     * @param offsetEntity The entity that holds offset actions and is eligible to mint an NFT.
     * @param offsetEntityID ID string of the offset entity.
     * @param beneficiary Beneficiary address for whom the RE was offset.
     * @param beneficiaryID ID string of the beneficiary.
     * @param offsetMessage Message to illustrate the offset intention.
     * @param offsetIds ID list of the offset actions to attach to the NFT.
     */
    function mintCertificate(
        address             offsetEntity,
        address             beneficiary,
        string calldata     offsetEntityID,
        string calldata     beneficiaryID,
        string calldata     offsetMessage,
        uint256[] calldata  offsetIds
    ) external virtual {
        // The caller is either the offseting enity, or the REC token contract, or the REC issuance contract
        require(_msgSender() == offsetEntity ||
                IArkreenRegistry(arkreenRegistry).getRECIssuance() == msg.sender ||
                IArkreenRegistry(arkreenRegistry).tokenRECs(msg.sender) != address(0),
                'ARB: Caller Not Allowed');

        uint256 offsetId = totalSupply() + 1;
        _safeMint(offsetEntity, offsetId);

        // Attach offset events to the newly minted NFT
        uint256 offsetAmount = _attachOffsetEvents(offsetId, offsetEntity, offsetIds);

        certificates[offsetId].offsetEntity = offsetEntity;
        certificates[offsetId].beneficiary = beneficiary;
        certificates[offsetId].offsetEntityID = offsetEntityID;      
        certificates[offsetId].beneficiaryID = beneficiaryID;
        certificates[offsetId].offsetMessage = offsetMessage;
        certificates[offsetId].creationTime = block.timestamp;
        certificates[offsetId].offsetTotalAmount += offsetAmount;

        // Accumulate the total retired offset amount
        totalOffsetRetired += offsetAmount;

        emit OffsetCertificateMinted(offsetId);
        emit Locked(offsetId);
    }

    /**
     * @dev Update the message of offset certificate NFT, only callable within 3 days post creation.
     * Empty values are ignored, existing stored values are kept.
     * @param tokenId ID of the NFT to update.
     * @param offsetEntityID Identification string for the offset entity.
     * @param beneficiary Address of the beneficiary to store in the NFT.
     * @param beneficiaryID Identification string of the beneficiary
     * @param offsetMessage Offset indication message to store in the NFT.
     */
    function updateCertificate(
        uint256 tokenId,
        address beneficiary,        
        string calldata offsetEntityID,
        string calldata beneficiaryID,
        string calldata offsetMessage
    ) external virtual {
        require(msg.sender == ownerOf(tokenId), 'ARB: Not Owner');
        require(block.timestamp < (certificates[tokenId].creationTime + 3 days), 'ARB: Time Elapsed');

        if (beneficiary != address(0)) {
            certificates[tokenId].beneficiary = beneficiary;
        }
        if (bytes(offsetEntityID).length != 0) {
            certificates[tokenId].offsetEntityID = offsetEntityID;
        }
        if (bytes(beneficiaryID).length != 0) {
            certificates[tokenId].beneficiaryID = beneficiaryID;
        }
        if (bytes(offsetMessage).length != 0) {
            certificates[tokenId].offsetMessage = offsetMessage;
        }

        emit OffsetCertificateUpdated(tokenId);
    }


    /// @dev Receive hook to liquidize Arkreen RE Certificate into RE ERC20 Token
    function onERC721Received(
        address,  /* operator */
        address,  /*from */
        uint256 tokenId,
        bytes calldata data
    ) external virtual override whenNotPaused returns (bytes4) {

        // Check calling from REC Manager
        require( IArkreenRegistry(arkreenRegistry).getRECIssuance() == msg.sender, 'ARB: Not From REC Issuance');
        require( keccak256(data) == keccak256("Redeem"), 'ARB: Refused');

        RECData memory recData = IArkreenRECIssuance(msg.sender).getRECData(tokenId);
        require(recData.status == uint256(RECStatus.Certified), 'ARB: Wrong Status');  // Checking may be removed

        totalRedeemed = totalRedeemed + recData.amountREC;
        return this.onERC721Received.selector;
    }

    function supportsInterface(bytes4 interfaceId)
        public view override( ERC721EnumerableUpgradeable) returns (bool)
    {
        return  interfaceId == type(IERC721Receiver).interfaceId || 
                interfaceId == type(IERC5192).interfaceId || 
                super.supportsInterface(interfaceId);
    }  

    /**
     * @dev Get all the offset record of the specified NFT.        
     */
    function getCertificate(uint256 tokenId) external view returns (OffsetRecord memory) {
        return certificates[tokenId];
    }

    /**
     * @dev Get the list of all the offset actions ids        
     */
    function getUserEvents(address user) external view returns (uint256[] memory) {
        return userActions[user];
    }

    /// @dev retrieve all data from VintageData struct
    function getOffsetActions(uint256 offsetId) external view virtual returns (OffsetAction memory) {
        return (offsetActions[offsetId]);
    }    

    /**
     * @dev Get total offset amount of the specified NFT.        
     */
    function getOffsetAmount(uint256 tokenId) external view returns (uint256 amount) {
        return certificates[tokenId].offsetTotalAmount;
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

    // Add SBT interface
    function getVersion() external pure virtual returns (string memory) {
        return "0.1.1";
    }
}
