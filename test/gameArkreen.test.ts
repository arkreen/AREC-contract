import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { expandTo18Decimals } from "./utils/utilities";
import { BalanceTree } from './utils/balance-tree';
import { BigNumber } from 'ethers'

import {
  GameArkreen,
  GameArkreen__factory,
} from "../typechain";

const DEAD_ADDRESS =    '0x000000000000000000000000000000000000dEaD';
const ZERO_BYTES32 =    '0x0000000000000000000000000000000000000000000000000000000000000000'
const ONE_BYTES32 =     '0x1111111111111111111111111111111111111111111111111111111111111111'
const TWO_BYTES32 =     '0x2222222222222222222222222222222222222222222222222222222222222222'
const THREE_BYTES32 =   '0x3333333333333333333333333333333333333333333333333333333333333333'
const FOUR_BYTES32 =    '0x4444444444444444444444444444444444444444444444444444444444444444'

describe("GameArkreen", () => {
  let deployer: SignerWithAddress;
  let bob: SignerWithAddress;
  let alice: SignerWithAddress;
  let miner1: SignerWithAddress;
  let miner2: SignerWithAddress;
  let miner3: SignerWithAddress;
  let gArkreen: GameArkreen;

  beforeEach(async () => {
      [deployer, bob, alice, miner1, miner2, miner3] = await ethers.getSigners();
      gArkreen = await new GameArkreen__factory(deployer).deploy();
      await gArkreen.deployed();
  });


  describe("mint", () => {
    it("correctly constructs an ERC20", async () => {
      expect(await gArkreen.name()).to.equal("Arkreen Game Reward");
      expect(await gArkreen.symbol()).to.equal("gAKRE");
      expect(await gArkreen.decimals()).to.equal(18);
    });

  });

  describe("Reward Update", () => {
    it("Game Arkreen Failed: Not owner", async () => {
      await expect(gArkreen.connect(bob).rewardUpdate(0, expandTo18Decimals(100), ZERO_BYTES32))
              .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("Game Arkreen Failed: Not owner", async () => {
      await expect(gArkreen.rewardUpdate(1, expandTo18Decimals(100), ZERO_BYTES32))
              .to.be.revertedWith("Game Arkreen: New Claim Happened")
    })

    it("Game Arkreen Reward Update: Normal Basics", async () => {
      let lastBlockNumber
      await gArkreen.rewardUpdate(0, expandTo18Decimals(100), ONE_BYTES32)
      expect(await gArkreen.balanceOf(DEAD_ADDRESS)).to.equal(expandTo18Decimals(100))
      lastBlockNumber = (await ethers.provider.getBlock('latest')).timestamp
      expect(await gArkreen.GetLastRewardInfo()).to.deep.eq([0, lastBlockNumber, ONE_BYTES32])
      expect(await gArkreen.GetRewardRoot(0)).to.equal(ONE_BYTES32)

      await gArkreen.rewardUpdate(0, expandTo18Decimals(100), TWO_BYTES32)
      expect(await gArkreen.balanceOf(DEAD_ADDRESS)).to.equal(expandTo18Decimals(200))  
      lastBlockNumber = (await ethers.provider.getBlock('latest')).timestamp 
      expect(await gArkreen.GetLastRewardInfo()).to.deep.eq([0, lastBlockNumber, TWO_BYTES32]) 
      expect(await gArkreen.GetRewardRoot(0)).to.equal(TWO_BYTES32)  
      expect(await gArkreen.GetRewardRoot(1)).to.equal(ONE_BYTES32)  

      await gArkreen.rewardUpdate(0, expandTo18Decimals(100), THREE_BYTES32)
      expect(await gArkreen.balanceOf(DEAD_ADDRESS)).to.equal(expandTo18Decimals(300)) 
      lastBlockNumber = (await ethers.provider.getBlock('latest')).timestamp
      expect(await gArkreen.GetLastRewardInfo()).to.deep.eq([0, lastBlockNumber, THREE_BYTES32])        
      expect(await gArkreen.GetRewardRoot(0)).to.equal(THREE_BYTES32)   
      expect(await gArkreen.GetRewardRoot(1)).to.equal(TWO_BYTES32)  
      expect(await gArkreen.GetRewardRoot(2)).to.equal(ONE_BYTES32)         

      await gArkreen.rewardUpdate(0, expandTo18Decimals(100), FOUR_BYTES32)
      expect(await gArkreen.balanceOf(DEAD_ADDRESS)).to.equal(expandTo18Decimals(400)) 
      lastBlockNumber = (await ethers.provider.getBlock('latest')).timestamp
      expect(await gArkreen.GetLastRewardInfo()).to.deep.eq([0, lastBlockNumber, FOUR_BYTES32])            
      expect(await gArkreen.GetRewardRoot(0)).to.equal(FOUR_BYTES32)
      expect(await gArkreen.GetRewardRoot(1)).to.equal(THREE_BYTES32)   
      expect(await gArkreen.GetRewardRoot(2)).to.equal(TWO_BYTES32)  
      expect(await gArkreen.GetRewardRoot(3)).to.equal(ONE_BYTES32)    

      // Wrong index
      await expect(gArkreen.GetRewardRoot(64))
            .to.be.revertedWith("Game Arkreen: Wrong Index")

      for (let i = 0; i < 61; i++) {
        await gArkreen.rewardUpdate(0, expandTo18Decimals(100), THREE_BYTES32) 
      }

      // Check wrap correctly
      expect(await gArkreen.GetRewardRoot(0)).to.equal(THREE_BYTES32)
      expect(await gArkreen.GetRewardRoot(60)).to.equal(THREE_BYTES32)
      expect(await gArkreen.GetRewardRoot(61)).to.equal(FOUR_BYTES32)
      expect(await gArkreen.GetRewardRoot(62)).to.equal(THREE_BYTES32)   
      expect(await gArkreen.GetRewardRoot(63)).to.equal(TWO_BYTES32)  
    })
  });

  describe("Reward Claim", () => {
    it("Game Arkreen Claim: Normal Basics", async () => {
      let tree: BalanceTree
      let root: string 
      let lastBlockNumber: number

      tree = new BalanceTree([
        { account: bob.address, amount: expandTo18Decimals(100) },
        { account: alice.address, amount: expandTo18Decimals(200) },
      ])
      root = tree.getHexRoot()

      await gArkreen.rewardUpdate(0, expandTo18Decimals(300), root)
      expect(await gArkreen.balanceOf(DEAD_ADDRESS)).to.equal(expandTo18Decimals(300))
      
      // Bob claim
      const bob_Proof = tree.getProof(bob.address, expandTo18Decimals(100))
      await expect(gArkreen.claim(bob.address, expandTo18Decimals(100), bob_Proof))
              .to.emit(gArkreen, "Transfer")
              .withArgs(DEAD_ADDRESS, bob.address, expandTo18Decimals(100))
              .to.emit(gArkreen, "Claimed")
              .withArgs(1, bob.address, expandTo18Decimals(100));           // CountLastClaim  = 1

      await expect(gArkreen.claim(bob.address, expandTo18Decimals(100), bob_Proof))
              .to.be.revertedWith("Game Arkreen: Already Claimed")

      expect(await gArkreen.balanceOf(DEAD_ADDRESS)).to.equal(expandTo18Decimals(200))
      expect(await gArkreen.balanceOf(bob.address)).to.equal(expandTo18Decimals(100))
      expect(await gArkreen.AllClaimed()).to.equal(expandTo18Decimals(100))

      // Check claim info of bob
      lastBlockNumber = (await ethers.provider.getBlock('latest')).timestamp
      expect(await gArkreen.ClaimInfo(bob.address))
        .to.deep.eq([BigNumber.from(lastBlockNumber), expandTo18Decimals(100)])

      // Alice claim  
      const alice_Proof = tree.getProof(alice.address, expandTo18Decimals(200))
      await expect(gArkreen.claim(alice.address, expandTo18Decimals(200), alice_Proof))
              .to.emit(gArkreen, "Transfer")
              .withArgs(DEAD_ADDRESS, alice.address, expandTo18Decimals(200))      
              .to.emit(gArkreen, "Claimed")
              .withArgs(2, alice.address, expandTo18Decimals(200));           // CountLastClaim  = 2

      expect(await gArkreen.balanceOf(DEAD_ADDRESS)).to.equal(expandTo18Decimals(0))
      expect(await gArkreen.balanceOf(alice.address)).to.equal(expandTo18Decimals(200))  
      expect(await gArkreen.AllClaimed()).to.equal(expandTo18Decimals(300))

      // Check Alice's claim info
      lastBlockNumber = (await ethers.provider.getBlock('latest')).timestamp
      expect(await gArkreen.ClaimInfo(alice.address))
        .to.deep.eq([BigNumber.from(lastBlockNumber), expandTo18Decimals(200)])

      // New reward
      tree = new BalanceTree([
        { account: bob.address, amount: expandTo18Decimals(100) },
        { account: alice.address, amount: expandTo18Decimals(200) },
        { account: miner1.address, amount: expandTo18Decimals(300) },
        { account: miner2.address, amount: expandTo18Decimals(400) },
        { account: miner3.address, amount: expandTo18Decimals(500) },
      ])
      root = tree.getHexRoot()
      
      // Wrong claim counter
      await expect(gArkreen.rewardUpdate(1, expandTo18Decimals(1500), root))
            .to.be.revertedWith("Game Arkreen: New Claim Happened")

      // Claim
      await gArkreen.rewardUpdate(2, expandTo18Decimals(1500), root)

    })

  })

  describe("Block Reward Claim Temporarily", () => {
    it("Game Arkreen Claim: Normal Basics", async () => {

      const tree = new BalanceTree([
        { account: bob.address, amount: expandTo18Decimals(100) },
        { account: alice.address, amount: expandTo18Decimals(200) },
      ])
      const root = tree.getHexRoot()

      // Default TimeBlockedBefore is 0
      expect(await gArkreen.TimeBlockedBefore()).to.equal(0)

      // Update reward root
      await gArkreen.rewardUpdate(0, expandTo18Decimals(300), root)

      // Alice normally claimed
      const alice_Proof = tree.getProof(alice.address, expandTo18Decimals(200))
      await gArkreen.claim(alice.address, expandTo18Decimals(200), alice_Proof)

      // Block 600 seconds temporarily
      await gArkreen.EmergentBlock(600)

      // Check the blocking time
      const lastBlockNumber = (await ethers.provider.getBlock('latest')).timestamp
      expect(await gArkreen.TimeBlockedBefore()).to.equal(lastBlockNumber +600)
      
      // Bod is blocked
      const bob_Proof = tree.getProof(bob.address, expandTo18Decimals(100))

      // Cannot claim in blocking state
      await expect(gArkreen.claim(bob.address, expandTo18Decimals(100), bob_Proof))
              .to.be.revertedWith("Game Arkreen: Temporarily Blocked")

      // Bod is blocked to the last minute              
      await network.provider.send("evm_increaseTime", [599]);       // Move time forward

      await expect(gArkreen.claim(bob.address, expandTo18Decimals(100), bob_Proof))
              .to.be.revertedWith("Game Arkreen: Temporarily Blocked")
              
      // Block duration passed, claiming auto-unblocked      
      await network.provider.send("evm_increaseTime", [2]); 
      await gArkreen.claim(bob.address, expandTo18Decimals(100), bob_Proof)

    })

    it("Game Arkreen Claim: Unblock claiming after new reward updating", async () => {

      const tree = new BalanceTree([
        { account: bob.address, amount: expandTo18Decimals(100) },
        { account: alice.address, amount: expandTo18Decimals(200) },
      ])
      const root = tree.getHexRoot()

      // Update reward root
      await gArkreen.rewardUpdate(0, expandTo18Decimals(300), root)

      // Alice normally claimed
      const alice_Proof = tree.getProof(alice.address, expandTo18Decimals(200))
      await gArkreen.claim(alice.address, expandTo18Decimals(200), alice_Proof)      

      // Block 600 seconds temporarily
      await gArkreen.EmergentBlock(600)

      // Cannot claim in blocking state
      const bob_Proof = tree.getProof(bob.address, expandTo18Decimals(100))
      await expect(gArkreen.claim(bob.address, expandTo18Decimals(100), bob_Proof))
              .to.be.revertedWith("Game Arkreen: Temporarily Blocked")

      const tree1 = new BalanceTree([
        { account: bob.address, amount: expandTo18Decimals(300) },
        { account: alice.address, amount: expandTo18Decimals(500) },
      ])
      const root1 = tree1.getHexRoot()

      // Update reward root
      await gArkreen.rewardUpdate(1, expandTo18Decimals(700), root1)      // 300+500-100
              
      // Claiming auto-unblocked after reward updating     
      const bob_Proof_1 = tree1.getProof(bob.address, expandTo18Decimals(300))       
      await gArkreen.claim(bob.address, expandTo18Decimals(300), bob_Proof_1)

      // Claiming auto-unblocked after reward updating     
      const alice_Proof_1 = tree1.getProof(alice.address, expandTo18Decimals(500))
      await gArkreen.claim(alice.address, expandTo18Decimals(500), alice_Proof_1)
    })

  })
})
