// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
//import '@openzeppelin/contracts/access/AccessControl.sol';

import "./interfaces/IArkreenRECIssuance.sol";
import "./interfaces/IArkreenRegistry.sol";
import "./interfaces/IArkreenRetirement.sol";
import "./interfaces/IPausable.sol";

// Import this file to use console.log
// import "hardhat/console.sol";

contract ArkreenRECToken is
    OwnableUpgradeable,
    UUPSUpgradeable,
    ERC20Upgradeable,
    IERC721Receiver
{
    // using SafeMath for uint256;	// seems not necessary
    using AddressUpgradeable for address;

    // Public constant variables
    string public constant NAME = 'Arkreen REC Token';
    string public constant SYMBOL = 'ART';

    // Public variables
    address public arkreenRegistry;    // Registry contract storing Arkreen contracts   
    address public issuerREC;           // Address of issuer of the original REC pre-liquidized    
    uint256 public totalLiquidized;     // Total amount of REC that is liquidized
    uint256 public totalOffset;         // Total amount of REC that is offset 

    address receiverFee;                // Receiver address to receive the liquidization fee
    uint256 ratioLiquidizedFee;         // Percentage in basis point (10000) of the liquidization fee

    // Events
    event OffsetFinished(address offsetEntity, uint256 amount, uint256 offsetId);

    // Modifiers
    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'ART: EXPIRED');
        _;
    }

    modifier whenNotPaused() {
        require(!IPausable(arkreenRegistry).paused(), 'ART: Paused');
        _;
    }
  
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address arkRegistry, address issuer) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();        
        __ERC20_init_unchained(NAME, SYMBOL);
        arkreenRegistry = arkRegistry;
        issuerREC = issuer;
    }

    function postUpdate() external onlyProxy onlyOwner 
    {}

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}    

    function decimals() public view virtual override returns (uint8) {
        return 9;
    }

    /**
     * @dev Offset the RE token by burning the tokens
     */
    function commitOffset(uint256 amount) public virtual whenNotPaused returns (uint256 offsetActionId) {
        offsetActionId = _offset(_msgSender(), amount);
    }

    /**
     * @dev Third party contract triggers the RE offset in the approval of the owner
     */
    function commitOffsetFrom(address account, uint256 amount)
        external virtual whenNotPaused returns (uint256 offsetActionId) 
    {
        _spendAllowance(account, _msgSender(), amount);
        offsetActionId = _offset(account, amount);
    }
   
    /**
     * @dev Internal offset function of the RE token, the RE tokens are burned
     */
    function _offset(address account, uint256 amount) internal virtual returns (uint256 offsetActionId) {
        _burn(account, amount);

        // Track total retirement amount in TCO2 factory
        address retirementContract = IArkreenRegistry(arkreenRegistry).getArkreenRetirement();
        offsetActionId = IArkreenRetirement(retirementContract).registerOffset(account, issuerREC, amount, 0);
        totalOffset += amount;

        emit OffsetFinished(account, amount, offsetActionId);
    }

    /**
     * @dev Offset the RE token and mint a certificate in the single transaction.
     * @param beneficiary Beneficiary address for whom the RE was offset.
     * @param offsetEntityID ID string of the offset entity.
     * @param beneficiaryID ID string of the beneficiary.
     * @param offsetMessage Message to illustrate the offset intention.
     * @param amount Amount to offset and issue an NFT certificate for.
     */
    function offsetAndMintCertificate(
        address         beneficiary,
        string calldata offsetEntityID,
        string calldata beneficiaryID,
        string calldata offsetMessage,
        uint256         amount
    ) external virtual whenNotPaused {
        
        // Offset the specified amount
        uint256 offsetActionId = commitOffset(amount);
        uint256[] memory offsetActionIds = new uint256[](1);
        offsetActionIds[0] = offsetActionId;

        // Issue the offset certificate NFT
        address retirementContract = IArkreenRegistry(arkreenRegistry).getArkreenRetirement();
        IArkreenRetirement(retirementContract).mintCertificate(
                        _msgSender(), beneficiary, offsetEntityID, beneficiaryID, offsetMessage, offsetActionIds);
    }

     /// @dev Receive hook to liquidize Arkreen RE Certificate into RE ERC20 Token
    function onERC721Received(
        address, /* operator */
        address from,
        uint256 tokenId,
        bytes calldata /* data */
    ) external virtual override whenNotPaused returns (bytes4) {

        // Check calling from REC Manager
        require( IArkreenRegistry(arkreenRegistry).getRECIssuance() == msg.sender, 'ART: Not From REC Issuance');

        RECData memory recData = IArkreenRECIssuance(msg.sender).getRECData(tokenId);
        require(recData.status == uint256(RECStatus.Certified), 'ART: Wrong Status');

        totalLiquidized += recData.amountREC;

        // Prepare liquidization fee 
        uint256 fee = 0;
        if(ratioLiquidizedFee != 0 && receiverFee != address(0)) {
            fee = recData.amountREC * ratioLiquidizedFee / 10000;
            _mint(receiverFee, fee);
        }

        _mint(from, recData.amountREC - fee);

        return this.onERC721Received.selector;
    }

    /**
     * @dev set the ratio of liquidization fee
     */     
    function setRatioFee(uint256 ratio) external onlyOwner {
        require(ratio <10000, 'ART: Wrong Data');
        ratioLiquidizedFee = ratio;
    }  

    /**
     * @dev set the receiver of liquidization fee
     */     
    function setReceiverFee(address receiver) external onlyOwner {
        require(receiver != address(0), 'ART: Wrong Address');
        receiverFee = receiver;
    }  

}