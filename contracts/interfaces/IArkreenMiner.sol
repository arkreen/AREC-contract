// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IArkreenMiner {
    function isOwner(address owner) external view returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}
