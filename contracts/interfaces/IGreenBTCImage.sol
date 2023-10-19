// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IGreenBTCImage{
    struct Green_BTC{
        uint256 height;
        uint256 cellCount;
        address beneficiary;
        uint8   greenType;
        string  blockTime;
        string  energyStr;
    }
    function getCertificateSVGBytes(Green_BTC calldata gbtc) external pure returns(string memory);
    function getGreenTreeSVGBytes() external pure returns(string memory);
    function getBlindBoxSVGBytes(uint256 num) external pure returns(string memory);

}