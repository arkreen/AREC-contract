// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./ArkreenRECIssuanceType.sol";  

contract ArkreenRECIssuanceStorage {
    address public tokenAKRE;                       // token adddress of AKRE
    address public arkreenRegistery;                // contracts storing all miner's ownership    
    string  public baseURI;

    mapping(uint256 => RECData) public allRECData;
    mapping(uint256 => PayInfo) public allPayInfo;      

    uint256 public allRECIssued;                     // total AREC amount issued by minting AREC NFT
    uint256 public allRECRedeemed;                   // total AREC amount redeemed by retiring AREC NFT
    uint256 public allRECLiquidized;                 // total AREC amount Liquidized by Liquidizing to AREC ERC20 token

    // The REC amount issued by specific issuer
    mapping(address => uint256) public allRECByIssuer;

    // The total payment paid to specific issuer with specific payment token
    mapping(address => mapping(address => uint256)) public paymentByIssuer;

    // All payment tokens acceptable
    mapping(address => bool) public paymentTokens;

    // AREC mint/issance price, payment token amount per AREC (Decimal=9)
    // Ex: 1AREC -> 0.2USDT,  ARECMintPrice = 0.2 * 10**6
    RECMintPrice[] ARECMintPrice;

    // keccak256("RECIssuance(address owner,uint256 startTime,uint256 endTime,
    //                        uint256 amountREC,uint256 merkelRoot,string url,
    //                        uint256 nonce,uint256 feeREC,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH = 0xEB053433B86341259C91DE8E051FF855E4AEF3CABE1825EE9F5D9A80315FB700;      
}