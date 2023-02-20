// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./ArkreenOperatorTypes.sol";  

abstract contract ArkreenOperatorStorage {

    address public routerSwap;            // Address of the DEX router
    address public tokenNative;           // The wrapped token of the Native token, such as WETH, WMATIC

//  mapping(address => mapping(address => twinPair)) public pools;             // ART token => (pair token => two LP pools) 

}