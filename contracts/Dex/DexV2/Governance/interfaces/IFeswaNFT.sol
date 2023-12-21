// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
pragma experimental ABIEncoderV2;

    enum PoolRunningPhase {
        BidToStart,
        BidPhase, 
        BidDelaying,
        BidSettled,
        PoolHolding, 
        PoolForSale
    }

    struct FeswaPair {
        address tokenA;
        address tokenB;
        uint256 currentPrice;
        uint64  timeCreated;
        uint64  lastBidTime; 
        PoolRunningPhase  poolState;
    }

interface IFeswaNFT {
    // Views
    function AIRDROP_FOR_FIRST() external view returns (uint);
    function AIRDROP_RATE_FOR_WINNER() external view returns (uint);
    function MINIMUM_PRICE_INCREACE() external view returns (uint);
    function SaleStartTime() external view returns (uint);
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);
    function getPoolTokens(uint256 tokenId) external view returns (address tokenA, address tokenB);
    function BidFeswaPair(address tokenA, address tokenB, address to) external payable returns (uint256 tokenID);
    function FeswaPairForSale(uint256 tokenID, uint256 pairPrice) external returns (uint256 newPrice);
    function FeswaPairBuyIn(uint256 tokenID, uint256 newPrice, address to) external payable returns (uint256 getPrice);
    function getPoolInfoByTokens(address tokenA, address tokenB) external view returns (uint256 tokenID, address nftOwner, FeswaPair memory pairInfo);
    function getPoolInfo(uint256 tokenID) external view returns (address nftOwner, FeswaPair memory pairInfo);
    function FeswaPairSettle(uint256 tokenID) external;
    function ManageFeswaPair( uint256 tokenID, address pairProfitReceiver, uint256 rateTrigger, uint256 switchOracleOn ) external returns (address pairAAB, address pairABB);
}