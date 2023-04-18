// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @dev Patch the existing contract in case to upgrde this contract
 *      This mechanism is given up for the gas fee consideration
 */

abstract contract Patch is Ownable {
    /**
     * @dev Storage slot with the address of the current implementation.
     * This is the keccak-256 hash of "patch.implementation" subtracted by 1, and is
     * validated in the constructor.
     */
    bytes32 private constant _IMPLEMENTATION_SLOT = 0x39533E06CAF7A4B911A916EDEE14331530B9589C6C5FC4C05C447473DC6499C4;

    event PatchChanged(address indexed newPatch);

    /**
     * @dev Returns the current patch address.
     */
    function getPatch() public view returns (address patch) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            patch := sload(_IMPLEMENTATION_SLOT)
        }
    }

    /**
     * @dev Upgrades the patch to a new implementation.
     * 
     * Emits an {Upgraded} event.
     */
    function setPatch(address newPatch) public onlyOwner {
        require(Address.isContract(newPatch), "UpgradeablePatch: new implementation is not a contract");

        bytes32 slot = _IMPLEMENTATION_SLOT;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            sstore(slot, newPatch)
        }
        emit PatchChanged(newPatch);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */

    function callPatch(bytes calldata patchCallData ) external payable virtual {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            let realSize := sload(patchCallData.offset)
            calldatacopy(0, 68, realSize)

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), sload(_IMPLEMENTATION_SLOT), 0, realSize, 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}