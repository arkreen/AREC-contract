// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IArkreenRetirement {
    function registerOffset(address, address, uint256, uint256) external returns (uint256);
    function mintCertificate(address, address, string calldata, string calldata,
                              string calldata, uint256[] calldata) external;
}