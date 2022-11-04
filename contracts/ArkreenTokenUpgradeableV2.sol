// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol';
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';


contract ArkreenTokenUpgradeableV2 is 
    ContextUpgradeable,
    ERC20BurnableUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    IERC20Permit,
    UUPSUpgradeable
{
    using AddressUpgradeable for address;

    string  private constant _NAME = 'Arkreen Token';
    string  private constant _SYMBOL = 'gAKRE';
    string  private constant _VERSION = '1';
    bytes32 private constant _PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    
    bytes32 private _DOMAIN_SEPARATOR;

    mapping(address => uint256) public nonces;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }


    function initialize(uint256 amount, address foundationAddr)
        external
        virtual
        initializer
    {
        __UUPSUpgradeable_init_unchained();
        __ERC1967Upgrade_init_unchained();
        __ERC20Burnable_init_unchained();
        __Context_init_unchained();
        
        __ERC20_init_unchained(_NAME, _SYMBOL);
        __Ownable_init_unchained();
        __Pausable_init_unchained();

        // address owner = _msgSender();
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

        _mint(foundationAddr, amount * 10 ** decimals());
    }

    function postUpdate(address foundationAddr) external onlyProxy onlyOwner {
        _mint(foundationAddr, (10_000_000_000 - 10) * 10 ** decimals());
    }

    function pause() external onlyOwner{
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }


    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external{

        require(block.timestamp <= deadline, "ERC20Permit: expired deadline");

        bytes32 structHash = keccak256(abi.encode(_PERMIT_TYPEHASH, owner, spender, value, nonces[owner], deadline));
        bytes32 digest = keccak256(abi.encodePacked('\x19\x01', _DOMAIN_SEPARATOR, structHash));
        address signer = ECDSA.recover(digest, v, r, s);

        require(signer == owner, "ERC20Permit: invalid signature");
        nonces[owner] += 1;

        _approve(owner, spender, value);
    }


    function DOMAIN_SEPARATOR() external view returns (bytes32){
        return _DOMAIN_SEPARATOR;
    }


    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }


    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

}