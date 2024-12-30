// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WrappedToken is ERC20 {
    error ZeroAddress();
    error OnlyBridge();

    address public bridge;

    modifier onlyBridge() {
        if (_msgSender() != bridge) revert OnlyBridge();
        _;
    }
    
    constructor(string memory name, string memory symbol, address bridge_) ERC20(name, symbol) {
        if (bridge_ == address(0)) revert ZeroAddress();

        bridge = bridge_;
    }

    function mint(address to, uint256 amount) external onlyBridge {
        _mint(to, amount);
    }

    function burn(uint256 amount) external onlyBridge {
        _burn(_msgSender(), amount);
    }
}