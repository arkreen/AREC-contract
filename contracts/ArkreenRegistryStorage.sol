// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @dev  ArkreenRegistryStorage is to store system critical information
contract ArkreenRegistryStorage {

    struct IssuerStatus {
        bool      added;
        uint64    addTime;
        uint64    removeTime;
        address   tokenREC;
        string    issuerId;
    }

    // Arkreen Miner Contact Address
    address internal arkreenMiner;

    // Arkreen REC Issuance Contact Address
    address internal arkreenRECIssuance;

    // Arkreen REC Retirement Contract Address
    address internal arkreenRECRetirement;
    
    // REC issuers
    uint256 public numIssuers;
    mapping(address => IssuerStatus) public recIssuers;
    mapping(address => address) public tokenRECs;           // mapping token to issuer
    mapping(uint256 => address) public allIssuers;          // All Issuers
}
