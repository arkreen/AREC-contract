// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../Arkreen/ArkreenToken.sol";

// For testing of contract upgrading 
contract ArkreenTokenTest is ArkreenToken
{
    function burn(address user, uint256 amount) external onlyOwner {
        super._burn(user, amount);
    }
}
