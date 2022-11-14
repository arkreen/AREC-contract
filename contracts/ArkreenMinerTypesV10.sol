// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

enum MinerType {
    Empty,              // 0
    GameMiner,          // 1
    RemoteMiner,        // 2
    StandardMiner       // 3
}

enum MinerStatus {
    Pending,            // 0
    Normal,             // 1
    Locked,             // 2
    Terminated          // 3
}

struct Miner {
    address         mAddress;
    MinerType       mType;
    MinerStatus     mStatus;
    uint32          timestamp;
}    

enum MinerManagerType {
    Miner_Manager,        // 0
    Register_Authority,   // 1
    Payment_Receiver      // 2
}

struct Signature {
    address     token;
    uint256     value;
    uint256     deadline;  
    uint8       v;
    bytes32     r;
    bytes32     s;              
}

struct Sig {
    uint8       v;
    bytes32     r;
    bytes32     s;              
}