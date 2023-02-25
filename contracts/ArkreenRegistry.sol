// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';

import "./interfaces/IMinerRegister.sol";
import "./interfaces/IArkreenRegistry.sol";
import "./interfaces/IERC20.sol";
import "./libraries/TransferHelper.sol";
import "./ArkreenRegistryStorage.sol";

contract ArkreenRegistry is
    OwnableUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ArkreenRegistryStorage
{    
    using AddressUpgradeable for address;

    // Constants
    bytes32 public constant PAUSER_ROLE = keccak256('PAUSER_ROLE');

    // Modifiers
    modifier onlyBy(address _factory, address _owner) {
        require(
            _factory == _msgSender() || _owner == _msgSender(),
            'Caller is not the factory'
        );
        _;
    }

    modifier checkAddress(address addressToCheck) {
        require(addressToCheck != address(0), 'Arkreen: Zero Address');
        require(addressToCheck.isContract(), "Arkreen: Wrong Contract Address");
        _;
    }

    /// @dev modifier that only lets the contract's owner and granted pausers pause the system
    modifier onlyPausers() {
        require(
            hasRole(PAUSER_ROLE, msg.sender) || owner() == msg.sender,
            'Arkreen: Caller Not Allowed'
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
  
    function initialize() external virtual initializer {
        __Ownable_init_unchained();
        __Pausable_init_unchained();
        __AccessControl_init_unchained();                
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        virtual
        override
        onlyOwner
    {}

    /// @dev Emergency function to pause the system
    function pause() external virtual onlyPausers {
        _pause();
    }

    /// @dev unpause the system
    function unpause() external virtual onlyPausers {
        _unpause();
    }

    function addRECIssuer(address issuer, address tokenREC, string memory issuerId) external virtual onlyOwner {
        require(issuer != address(0), 'Arkreen: Zero Address');
        require(tokenREC.isContract(), 'Arkreen: Wrong Token Address');

        require(recIssuers[issuer].addTime == uint64(0), 'Arkreen: Issuer Already Added');

        unchecked { ++numIssuers; }
        IssuerStatus memory issuerStatus = IssuerStatus(true, uint64(block.timestamp), uint64(0), tokenREC, issuerId);
        recIssuers[issuer] = issuerStatus;
        tokenRECs[tokenREC] = issuer;
        allIssuers[numIssuers] = issuer;
    }

    function removeRECIssuer(address issuer) external virtual onlyOwner {
        require(issuer != address(0), 'Arkreen: Zero Address');
        require(recIssuers[issuer].added, 'Arkreen: Issuer Not Added');
        recIssuers[issuer].added = false;
        recIssuers[issuer].removeTime = uint64(block.timestamp);
        // the mapping from tokenREC to recIssuers are kept
    }

    function isRECIssuer(address issuer) external virtual returns(bool) {
        return recIssuers[issuer].added;
    }

    function newAssetAREC(string calldata idAsset, address issuer, address tokenREC, address tokenPay,
                        uint128 rateToIssue, uint16 rateToLiquidize, string calldata description) external virtual onlyOwner {
        numAsset += 1;
        allAssets[numAsset] = AssetAREC(idAsset, issuer, tokenREC, tokenPay, rateToIssue, rateToLiquidize, true, description);
    }

    function manageAssetAREC( uint256 idAsset, uint256 flag, uint128 rateToIssue, uint16 rateToLiquidize, bool bActive,
                                string calldata description) external virtual onlyOwner {
        if((flag & 0x01) != 0) {
            allAssets[idAsset].rateToIssue = rateToIssue;
        }
        if((flag & 0x02) != 0) {
            require(rateToLiquidize < 10000, "Arkreen: Wrong liquidize rate");
            allAssets[idAsset].rateToLiquidize = rateToLiquidize;
        }
        if((flag & 0x04) != 0) {
            allAssets[idAsset].bActive = bActive;
        }
        if((flag & 0x08) != 0) {
            allAssets[idAsset].description = description;
        }        
    }

    function getAssetInfo(uint256 idAsset) public view returns (address issuer, address tokenREC,
                                    address tokenPay, uint128 rateToIssue, uint16 rateToLiquidize) {
        require(allAssets[idAsset].bActive, "Arkreen: Wrong Asset");
        issuer = allAssets[idAsset].issuer;
        tokenREC = allAssets[idAsset].tokenREC;
        tokenPay = allAssets[idAsset].tokenPay;
        rateToIssue = allAssets[idAsset].rateToIssue;      
        rateToLiquidize = allAssets[idAsset].rateToLiquidize;      
    }


    function getRECToken(address issuer) external virtual returns(address tokenREC) {
        require(recIssuers[issuer].added, 'Arkreen: Issuer Not Added');
        tokenREC = recIssuers[issuer].tokenREC;
    }

    function setArkreenRetirement(address arkRetirement) external virtual onlyOwner checkAddress(arkRetirement) {
        arkreenRECRetirement = arkRetirement;
    }

    function getArkreenRetirement() external view virtual returns (address) {
        require(arkreenRECRetirement != address(0), 'Arkreen: Zero Retirement Address');
        return arkreenRECRetirement;
    }  

    function setArkreenMiner(address arkMiner) external virtual onlyOwner checkAddress(arkMiner) {
        arkreenMiner = arkMiner;
    }

    function getArkreenMiner() external view virtual returns (address) {
        require(arkreenMiner != address(0), 'Arkreen: Zero Miner Address');
        return arkreenMiner;
    }  

    function setRECIssuance(address recIssuance) external virtual onlyOwner checkAddress(recIssuance) {
        arkreenRECIssuance = recIssuance;
    }

    function getRECIssuance() external view virtual returns (address) {
        require(arkreenRECIssuance != address(0), 'Arkreen: Zero Issuance Address');
        return arkreenRECIssuance;
    }    
}