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
    string  public constant NAME = 'HashKey ESG BTC';
    string  public constant SYMBOL = 'HGBTC';
    uint256 public constant ART_DECIMAL = 9;

    string  public baseURI;
    address public tokenHART;                 // HashKey Pro ART
    address public arkreenBuilder;
    address public tokenNative;           // The wrapped token of the Native token, such as WETH, WMATIC

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
        uint256             deadline,
        uint256[] calldata  bricksToGreen,
        BadgeInfo calldata  badgeInfo
    ) external payable {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Wrap MATIC to WMATIC  
        IWETH(tokenNative).deposit{value: msg.value}();

        // actionBuilderBadge(address,address,uint256,uint256,bool,uint256,(address,string,string,string)): 0x28a5e88d
        bytes memory callData = abi.encodeWithSelector(0x28a5e88d, tokenNative, tokenHART, msg.value,
                                    (bricksToGreen.length) * (10**ART_DECIMAL), false, deadline, badgeInfo);

        (bool success, bytes memory returndata) = arkreenBuilder.call(abi.encodePacked(callData, _msgSender()));

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

    function greenizeBTC(
        address             tokenPay,
        uint256             amountPay,
        uint256             deadline,
        uint256[] calldata  bricksToGreen,
        BadgeInfo calldata  badgeInfo
    ) external  {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Transfer payement 
        address actorGreenBTC = _msgSender();
        TransferHelper.safeTransferFrom(tokenPay, actorGreenBTC, address(this), amountPay);

        // actionBuilderBadge(address,address,uint256,uint256,bool,uint256,(address,string,string,string)): 0x28a5e88d
        bytes memory callData = abi.encodeWithSelector(0x28a5e88d, tokenPay, tokenHART, amountPay,
                                    (bricksToGreen.length) * (10**ART_DECIMAL), false, deadline, badgeInfo);

        (bool success, bytes memory returndata) = arkreenBuilder.call(abi.encodePacked(callData, actorGreenBTC));

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

    function greenizeBTCPermit(
        uint256[] calldata  bricksToGreen,
        BadgeInfo calldata  badgeInfo,
        Signature calldata  permitToPay
    ) external  {               // Deadline will be checked by router, no need to check here. //ensure(permitToPay.deadline)

        // Permit payment token
        address actorGreenBTC = _msgSender();
        IERC20Permit(permitToPay.token).permit(actorGreenBTC, address(this), 
                        permitToPay.value, permitToPay.deadline, permitToPay.v, permitToPay.r, permitToPay.s);

        // Transfer payement 
        TransferHelper.safeTransferFrom(permitToPay.token, actorGreenBTC, address(this), permitToPay.value);

        // actionBuilderBadge(address,address,uint256,uint256,bool,uint256,(address,string,string,string)): 0x28a5e88d
        bytes memory callData = abi.encodeWithSelector(0x28a5e88d, permitToPay.token, tokenHART, permitToPay.value,
                                    (bricksToGreen.length) * (10**ART_DECIMAL), false, permitToPay.deadline, badgeInfo);

        (bool success, bytes memory returndata) = arkreenBuilder.call(abi.encodePacked(callData, actorGreenBTC));

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

    // Add SBT interface(0.1.1)
    // Add offset trace function (0.2.0)
    function getVersion() external pure virtual returns (string memory) {
        return "0.1.0";
    }
}
