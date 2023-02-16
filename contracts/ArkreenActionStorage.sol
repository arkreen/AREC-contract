// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./ArkreenActionTypes.sol";  

abstract contract ArkreenActionStorage {

    address public routerSwap;           // Address of the DEX router

    mapping(address => mapping(address => twinPair)) public pools;             // ART token => (pair token => two LP pools) 

}