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

    event GreenBitCoin(uint256 height, uint256 ARTCount, address minter, uint8 greenType);
    event OpenBox(address opener, uint256 tokenID, uint256 blockNumber);
    event RevealBoxes(uint256[] revealList, bool[] wonList);
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
    function initialize(address authority, address builder, address cART, address native)
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
        authorizer      = authority;
        arkreenBuilder  = builder;
        tokenCART       = cART;
        tokenNative     = native;
        luckyRate       = 5;
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner
    {}
}
