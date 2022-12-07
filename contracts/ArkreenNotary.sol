// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/access/Ownable.sol";

contract ArkreenNotary is Ownable{

    string  public blockHash;
    string  public cid;
    uint256 public blockHeight;
    uint256 public totalPowerGeneraton;
    uint256 public circulatingSupply;

    uint256 public updateCount;

    function saveData(
        string calldata blockHash_,
        string calldata cid_,
        uint256 blockHeight_,
        uint256 totalPowerGeneraton_,
        uint256 circulatingSupply_
    ) 
        public onlyOwner
    {
        //require(blockHash != _blockHash, "block hash repeat!");
        require(blockHeight_ >= blockHeight, "blockHeight data must increase!");
        require(totalPowerGeneraton_ >= totalPowerGeneraton, "totalPowerGeneraton data must increase!");
        require(circulatingSupply_ >= circulatingSupply, "circulatingSupply data must increase!");

        blockHash          = blockHash_;
        cid                = cid_;
        blockHeight        = blockHeight_;
        totalPowerGeneraton = totalPowerGeneraton_;
        circulatingSupply  = circulatingSupply_;

        updateCount += 1;
    }
}