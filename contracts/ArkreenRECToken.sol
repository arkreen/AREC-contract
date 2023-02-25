// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
//import '@openzeppelin/contracts/access/AccessControl.sol';

import "./ArkreenRECIssuanceType.sol";
import "./interfaces/IArkreenRECIssuance.sol";
import "./interfaces/IArkreenRegistry.sol";
import "./interfaces/IArkreenBadge.sol";
import "./interfaces/IPausable.sol";

// Import this file to use console.log
//import "hardhat/console.sol";

contract ArkreenRECToken is
    OwnableUpgradeable,
    UUPSUpgradeable,
    ERC20Upgradeable,
    IERC721Receiver
{
    // using SafeMath for uint256;    // seems not necessary
    using AddressUpgradeable for address;

    // Public constant variables
    string public constant NAME = 'Arkreen REC Token';
    string public constant SYMBOL = 'ART';

    uint256 public constant MAX_SKIP = 20;
    uint256 public constant FLAG_OFFSET = 1<<64;

    // Public variables
    address public arkreenRegistry;           // Registry contract storing Arkreen contracts   
    address public issuerREC;                 // Address of issuer of the original REC pre-liquidized    
    uint256 public totalLiquidized;           // Total amount of REC that is liquidized
    uint256 public totalOffset;               // Total amount of REC that is offset 

    address public receiverFee;                // Receiver address to receive the liquidization fee
    uint256 public ratioLiquidizedFee;         // Percentage in basis point (10000) of the liquidization fee

    mapping(uint256 => uint256) public allARECLiquidized;   // Loop of all AREC ID: 1st-> 2nd-> ..-> last-> 1st
    uint256 public latestARECID;                            // NFT ID of the latest AREC added to the loop 
    uint256 public ratioFeeToSolidify;                      // Percentage in basis point (10000) to charge for solidifying ART to AREC NFT

//    uint256 partialARECID;                                // AREC NFT ID partialy offset
//    uint256 partialAvailableAmount;                       // Amount available for partial offset
    uint256 public triggerUpgradeAmount;                    // The amount to trigger solidify upgrade
    address public climateBuilder;

    // Events
    event OffsetFinished(address indexed offsetEntity, uint256 amount, uint256 offsetId);
    event Solidify(address indexed account, uint256 amount, uint256 numberAREC, uint256 feeSolidify);    

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

    function initialize(address arkRegistry, address issuer, string calldata name, string calldata symbol) external virtual initializer {
        __Ownable_init_unchained();
        __UUPSUpgradeable_init();        
        if(bytes(symbol).length == 0) {
          __ERC20_init_unchained(NAME, SYMBOL);
        } else {
          __ERC20_init_unchained(name, symbol);          
        }
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
        offsetActionId = _offset(msg.sender, _msgSender(), amount);
    }

    /**
     * @dev Third party contract triggers the RE offset in the approval of the owner
     */
    function commitOffsetFrom(address account, uint256 amount)
        external virtual whenNotPaused returns (uint256 offsetActionId) 
    {
        _spendAllowance(account, _msgSender(), amount);
        offsetActionId = _offset(account, account, amount);
    }
   
    /**
     * @dev Internal offset function of the RE token, the RE tokens are burned
     */
    function _offset(address account, address owner, uint256 amount) internal virtual returns (uint256 offsetActionId) {

        if(totalOffset < triggerUpgradeAmount) {                                // To check whether triggering upgrade
            uint256 offsetAmount = triggerUpgradeAmount - totalOffset;
            offsetAmount = (offsetAmount > amount) ? amount: offsetAmount;
            amount -= offsetAmount;
            _burn(account, offsetAmount);

            // Track total retirement amount in TCO2 factory
            address badgeContractU = IArkreenRegistry(arkreenRegistry).getArkreenRetirement();
            offsetActionId = IArkreenBadge(badgeContractU).registerOffset(owner, issuerREC, offsetAmount, 0);
            totalOffset += offsetAmount;

            emit OffsetFinished(owner, offsetAmount, offsetActionId);
            if(amount == 0) {
                return offsetActionId;
            }
        }

        require(amount != 0, 'ART: Zero Offset');

        address issuanceAREC = IArkreenRegistry(arkreenRegistry).getRECIssuance();
        address badgeContract = IArkreenRegistry(arkreenRegistry).getArkreenRetirement();

        // Track total retirement amount in TCO2 factory
        uint256 steps = 0;
        uint256 curAREC; 
        RECData memory recData;
        uint256 amountFilled = 0; 
        uint256 amountRegister;

        uint256 partialAvailableAmount;
        uint256 partialARECID;

        uint256 amountOffset;
        uint256 detailsCounter;

        (partialAvailableAmount, partialARECID) = IArkreenBadge(badgeContract).getDetailStatus();

        if(amount > partialAvailableAmount) {
            while(steps < MAX_SKIP) {
                if(partialAvailableAmount == 0) {
                    curAREC = allARECLiquidized[latestARECID];
                    _remove(latestARECID, curAREC);
                    IArkreenRECIssuance(issuanceAREC).safeTransferFrom(address(this), badgeContract, curAREC);
                    
                    recData = IArkreenRECIssuance(issuanceAREC).getRECData(curAREC);
                    partialAvailableAmount = recData.amountREC;
                    partialARECID = curAREC;
                }

                if(amount <= partialAvailableAmount) {
                    if (steps==0) break;   
                    amountRegister = amount;
                } else {
                    amountRegister = partialAvailableAmount;
                }
                
                (detailsCounter, partialAvailableAmount) = 
                                IArkreenBadge(badgeContract).registerDetail(amountRegister, partialARECID, (steps==0));
                steps++;
                amountFilled += amountRegister;
                amount -= amountRegister;

                if(amount==0) break;
            }
        }

        amountOffset = (steps==0) ? amount: amountFilled;
        _burn(account, amountOffset);

        offsetActionId = IArkreenBadge(badgeContract).registerOffset(owner, issuerREC, amountOffset, FLAG_OFFSET+detailsCounter);
        totalOffset += amountOffset;

        emit OffsetFinished(owner, amountOffset, offsetActionId);
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
        address owner = _msgSender();
        uint256 offsetActionId = _offset(msg.sender, owner, amount);     // maybe called from climate operator, so use msg.sender
        uint256[] memory offsetActionIds = new uint256[](1);
        offsetActionIds[0] = offsetActionId;

        // Issue the offset certificate NFT
        address badgeContract = IArkreenRegistry(arkreenRegistry).getArkreenRetirement();
        IArkreenBadge(badgeContract).mintCertificate(
                        owner, beneficiary, offsetEntityID, beneficiaryID, offsetMessage, offsetActionIds);
    }

    /**
     * @dev Solidify the ART token to AREC NFT.
     * @param amount The amount requesting to solidify
     */
    function solidify(uint256 amount) external virtual whenNotPaused 
                returns (uint256 solidifiedAmount, uint256 numberAREC, uint256 feeSolidify) {

        require(latestARECID != 0, 'ART: No Liquidized AREC');
        bool chargeOn = (receiverFee != address(0)) && (ratioFeeToSolidify != 0);           // To save gas
        if(chargeOn) amount = (amount * 10000) / (10000 + ratioFeeToSolidify);             // Substract the solidify fee 
        
        address solidifier = _msgSender();
        address issuanceAREC = IArkreenRegistry(arkreenRegistry).getRECIssuance();

        RECData memory recData;
        uint256 skips = 0;
        uint256 curAREC = allARECLiquidized[latestARECID];
        uint256 preAREC = latestARECID;

        while (skips <= MAX_SKIP) {
            recData = IArkreenRECIssuance(issuanceAREC).getRECData(curAREC);
            uint256 amountAREC = recData.amountREC;

            if(amount < amountAREC) {
                require(solidifiedAmount != 0, 'ART: Amount Too Less');                // Must solidify the oldest AREC first
                if(curAREC == latestARECID) break;
                skips++;
                preAREC = curAREC;
                curAREC = allARECLiquidized[curAREC];
            } else {
//              require(IArkreenRECIssuance(issuanceAREC).restore(curAREC), 'ART: Not Allowed');  // No need, status is changed by hooks
                IArkreenRECIssuance(issuanceAREC).safeTransferFrom(address(this), solidifier, curAREC);
                amount -= amountAREC;
                solidifiedAmount += amountAREC;
                numberAREC++;
                curAREC = _remove(preAREC, curAREC);
                if(curAREC == 0) break;
            }
        }

        _burn(solidifier, solidifiedAmount);                    // solidifiedAmount must be more than 0 here, burn once to save gas
        totalLiquidized -= solidifiedAmount;                    // 

        if(chargeOn) {
            feeSolidify = solidifiedAmount * ratioFeeToSolidify / 10000;
            _transfer(solidifier, receiverFee, feeSolidify);
        }

        emit Solidify(solidifier, solidifiedAmount, numberAREC, feeSolidify);      
    }

    /**
     * @dev Remove the AREC NFT specified by curAREC from the liquidized list.
     * @param preAREC The AREC NFT just previous in the list
     * @param curAREC The AREC NFT to remove
     * @return nextAREC the next AREC NFT ID if curAREC is not the last in the list
     *         otherwise, returns 0 while curAREC is the last in the list
     */
    function _remove(uint256 preAREC, uint256 curAREC) internal returns (uint256 nextAREC) {
        nextAREC = allARECLiquidized[curAREC];
        allARECLiquidized[preAREC] = nextAREC;

        if(curAREC == latestARECID) {                                   // if remove last AREC
            latestARECID = (preAREC == latestARECID) ? 0 : preAREC;     // if the last AREC is the only AREC
            nextAREC = 0;
        } 
        delete allARECLiquidized[curAREC];                      // delete the current AREC
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

        if(latestARECID == 0) {
            allARECLiquidized[tokenId] = tokenId;                           // build the loop list
            latestARECID = tokenId;
        } else {
            allARECLiquidized[tokenId] = allARECLiquidized[latestARECID];   // Point to loop head
            allARECLiquidized[latestARECID] = tokenId;                      // Add to the loop
            latestARECID = tokenId;                                         // refresh the newest AREC
        }

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
    function getARECInfo(uint256 number) external view returns (uint256 numAREC, ARECAmount[] memory amountAREC) {
        amountAREC = new ARECAmount[](number);
        if(latestARECID == 0) return (numAREC, amountAREC);

        address issuanceAREC = IArkreenRegistry(arkreenRegistry).getRECIssuance();
        uint256 curAREC = allARECLiquidized[latestARECID];
        for(uint256 index; index < number; index++) {
            amountAREC[index].ARECID = curAREC;
            amountAREC[index].amountREC = IArkreenRECIssuance(issuanceAREC).getRECData(curAREC).amountREC;
            numAREC ++;
            if(curAREC == latestARECID) break;
            curAREC = allARECLiquidized[curAREC];
        }
    }  

    function _msgSender() internal override view returns (address signer) {
        signer = msg.sender;
        if (msg.data.length>=20 && (signer == climateBuilder)) {
            assembly {
                signer := shr(96,calldataload(sub(calldatasize(),20)))
            }
        }    
    }

    /**
     * @dev set the ratio of liquidization fee
     */     
    function setRatioFee(uint256 ratio) external onlyOwner {
        require(ratio <10000, 'ART: Wrong Data');
        ratioLiquidizedFee = ratio;
    }  

    /**
     * @dev set the ratio of solidify fee to Solidify from ART to AREC
     */     
    function setRatioFeeToSolidify(uint256 ratio) external onlyOwner {
        require(ratio <10000, 'ART: Wrong Data');
        ratioFeeToSolidify = ratio;
    }  

    /**
     * @dev set the receiver of liquidization fee
     */     
    function setReceiverFee(address receiver) external onlyOwner {
        require(receiver != address(0), 'ART: Wrong Address');
        receiverFee = receiver;
    }

    function setTriggerAmount(uint256 amount) external onlyOwner {
        triggerUpgradeAmount = amount;
    }

    function setClimateBuilder(address builder) external onlyOwner {
        climateBuilder = builder;
    }
}