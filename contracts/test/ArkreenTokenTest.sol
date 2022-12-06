// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../libraries/SafeMath.sol";

import "../interfaces/IERC20.sol";
import "../interfaces/IERC20Permit.sol";

import "../types/ERC20Permit.sol";
import "../types/Ownable.sol";

// Just for testing 
contract ArkreenTokenTest is ERC20Permit, Ownable {
    using SafeMath for uint256;

    constructor(uint256 _totalSupply)
        ERC20("Arkreen DAO Token", "AKRE", 18)
        ERC20Permit("Arkreen DAO Token")
    {
        _mint(msg.sender, _totalSupply * 10**18);
    }

    function mint(address account_, uint256 amount_) external onlyOwner{
        _mint(account_, amount_);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account_, uint256 amount_) external {
        _burnFrom(account_, amount_);
    }

    function _burnFrom(address account_, uint256 amount_) internal {
        uint256 decreasedAllowance_ = allowance(account_, msg.sender).sub(
            amount_,
            "ERC20: burn amount exceeds allowance"
        );

        _approve(account_, msg.sender, decreasedAllowance_);
        _burn(account_, amount_);
    }
}
