// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

struct GreenBTCInfo {
    uint128     height;
    uint128     ARTCount;
    address     beneficiary;
    uint8       greenType;
    string      blockTime;          // For NFT display
    string      energyStr;          // For NTT display
}

struct NFTStaus {
    address     owner;
    uint64      blockHeight;
    bool        open;
    bool        reveal;
    bool        won;
    uint256     hash;
}

struct OpenInfo {
    uint64      tokenID;            // The token ID of the NFT opened
    uint64      openHeight;         // The height of the block opening the NFT
}

struct Sig {
    uint8       v;
    bytes32     r;
    bytes32     s;              
}

struct PayInfo {
    address     token;
    uint256     amount;
}

struct BadgeInfo {
    address     beneficiary;
    string      offsetEntityID;
    string      beneficiaryID;
    string      offsetMessage;
}