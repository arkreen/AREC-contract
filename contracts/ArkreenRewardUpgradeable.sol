// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';
import "./ArkreenTokenUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";



contract ArkreenRewardUpgradeable is 
        ContextUpgradeable,
        OwnableUpgradeable, 
        PausableUpgradeable,
        UUPSUpgradeable
{
    using AddressUpgradeable for address;

    string  private constant _NAME = 'Arkreen Reward';
    string  private constant _VERSION = '1';
    bytes32 private constant _REWARD_TYPEHASH = 
        keccak256("Reward(address receiver,uint256 value,uint256 nonce)");
    
    bytes32                     private _DOMAIN_SEPARATOR;
    address                     public validationAddress;
    ArkreenTokenUpgradeable     public ERC20Contract;
    mapping(address => uint256) public nonces;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address tokenAKRE)
        external
        virtual
        initializer
    {
        __Ownable_init_unchained();
        __Context_init_unchained();
        __Pausable_init_unchained();
        __UUPSUpgradeable_init();

        ERC20Contract = ArkreenTokenUpgradeable(tokenAKRE);
        
        //address owner = _msgSender();
        // assembly {
        //     sstore(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103, owner)
        // }
 
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes(_NAME)),
                keccak256(bytes(_VERSION)),
                block.chainid,
                address(this)
            )
        );  

    }   


    function pause() external onlyOwner{
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setERC20ContractAddress(address addr)public onlyOwner{
        require(addr != address(0), "zero address is not allowed");
        require(addr.isContract(), "is not a contract address");
        ERC20Contract = ArkreenTokenUpgradeable(addr);
    }

    function setValidationAddress(address addr)public onlyOwner{
        require(addr != address(0), "zero address is not allowed");
        validationAddress = addr;
    }

    function withdraw(
        address receiver,
        uint256 value,
        uint256 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual whenNotPaused{

        require(validationAddress != address(0) && address(ERC20Contract) != address(0), "address error");
        require(receiver == _msgSender(), "only receiver can withdraw token");
        require(nonce == nonces[_msgSender()], "nonce does not macth");

        bytes32 withdrawHash = keccak256(abi.encode(_REWARD_TYPEHASH, receiver, value, nonce));
        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', _DOMAIN_SEPARATOR, withdrawHash));
        address recoveredAddress = ecrecover(digest, v, r, s);

        require(recoveredAddress == validationAddress, "signer doesn't not match or singature error");
        nonces[_msgSender()] += 1;
        ERC20Contract.transfer(receiver, value);
    }


    function _authorizeUpgrade(address newImplementation)
        internal
        virtual
        override
        onlyOwner
    {}

}