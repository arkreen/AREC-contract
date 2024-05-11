// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IArkreenMiner {
    function getArkreenMinerContact() external view returns (address);
    function isOwner(address owner) external view returns (bool);
    function balalnceOf(address owner) external view returns (uint256);
}
