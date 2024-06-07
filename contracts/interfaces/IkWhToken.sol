// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IkWhToken {
    function burnFrom(address account, uint256 amount) external;
}