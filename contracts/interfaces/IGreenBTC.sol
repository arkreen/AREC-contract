// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../GreenBTCType.sol";

interface IGreenBTC {
    function authMintGreenBTCWithNative( 
        GreenBTCInfo    calldata gbtc,
        Sig             calldata sig,
        BadgeInfo       calldata badgeInfo,
        uint256                  deadline
    ) external payable;
}
