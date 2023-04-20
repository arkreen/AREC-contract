import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { ethers, network, upgrades } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { getOnboardingGameMinerDigest, getOnboardingRemoteMinerDigest, expandTo18Decimals, getOnboardingGameMinerMessage,
        randomAddresses, MinerType, MinerStatus, getApprovalDigest, getOnboardingStandardMinerDigest } from "./utils/utilities";
import { constants, BigNumber, Contract } from 'ethers'
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
//import { Bytes, BytesLike, Hexable } from "@ethersproject/bytes"

import {
  ArkreenTokenTest
} from "../typechain";

import {
  SignatureStruct,
  SigStruct,
} from "../typechain/contracts/ArkreenMinerV10";
import { deploy } from "@openzeppelin/hardhat-upgrades/dist/utils";


describe("ArkreenMinerV10", () => {
  let deployer:               SignerWithAddress
  let manager:                SignerWithAddress
  let register_authority:     SignerWithAddress
  let fund_receiver:          SignerWithAddress
  let owner1:     SignerWithAddress
  let owner2:     SignerWithAddress
  let miner1:     SignerWithAddress
  let miner2:     SignerWithAddress
  let maker1:     SignerWithAddress
  let maker2:     SignerWithAddress

  let AKREToken:                      ArkreenTokenTest
  let ArkreenMiner:        Contract
  let privateKeyManager:              string
  let privateKeyRegister:             string
  let privateKeyOwner:                string
  let privateKeyMaker:                string
  
  const FORMAL_LAUNCH = 1714536000;         // 2024-05-01, 12:00:00
  const DURATION_ACTIVATE = 3600 * 24 * 30; 
  const INIT_CAP_AIRDROP = 10000

  const Miner_Manager       = 0         
  const Register_Authority  = 1    
  const Payment_Receiver    = 2

  async function deployFixture() {
    const AKRETokenFactory = await ethers.getContractFactory("ArkreenTokenTest");
    AKREToken = await AKRETokenFactory.deploy(10_000_000_000);
    await AKREToken.deployed();

    const ArkreenMinerFactory = await ethers.getContractFactory("ArkreenMinerV10")
    ArkreenMiner = await upgrades.deployProxy(ArkreenMinerFactory,[AKREToken.address, manager.address, register_authority.address])
    await ArkreenMiner.deployed()

//  const ArkreenMinerFactoryV2 = await ethers.getContractFactory("ArkreenMinerV2");
//  const ArkreenMinerV2 = await upgrades.upgradeProxy(ArkreenMiner.address, ArkreenMinerFactoryV2)
//  await ArkreenMinerV2.deployed()    
//  ArkreenMiner = ArkreenMinerV2

    await AKREToken.transfer(owner1.address, expandTo18Decimals(10000))
    await AKREToken.connect(owner1).approve(ArkreenMiner.address, expandTo18Decimals(10000))
    await AKREToken.transfer(maker1.address, expandTo18Decimals(10000))
    await AKREToken.connect(maker1).approve(ArkreenMiner.address, expandTo18Decimals(10000))

    return {AKREToken, ArkreenMiner}
  }

  beforeEach(async () => {
    [deployer, manager, register_authority, fund_receiver, owner1, owner2, miner1, miner2, maker1, maker2] = await ethers.getSigners()
    privateKeyManager = process.env.MANAGER_TEST_PRIVATE_KEY as string
    privateKeyRegister = process.env.REGISTER_TEST_PRIVATE_KEY as string
    privateKeyOwner = process.env.OWNER_TEST_PRIVATE_KEY as string
    privateKeyMaker = process.env.MAKER_TEST_PRIVATE_KEY as string

    const fixture = await loadFixture(deployFixture)
    AKREToken = fixture.AKREToken
    ArkreenMiner = fixture.ArkreenMiner
  });

  describe("ArkreenMiner: Basics", () => {
    it("ArkreenMiner Basics: isOwner ", async () => {
      const receivers = randomAddresses(10)
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(manager).RemoteMinerOnboardInBatch(receivers, miners)
      expect(await ArkreenMiner.isOwner(owner1.address)).to.be.equal(false)
      expect(await ArkreenMiner.isOwner(receivers[0])).to.be.equal(true)
      expect(await ArkreenMiner.isOwner(receivers[9])).to.be.equal(true)
    })
    it("ArkreenMiner Basics: setManager ", async () => {
      await expect(ArkreenMiner.connect(owner1).setManager(Miner_Manager, manager.address))
              .to.be.revertedWith("Ownable: caller is not the owner")
      await ArkreenMiner.setManager(Miner_Manager, manager.address)
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      await ArkreenMiner.setManager(Payment_Receiver, fund_receiver.address)      
      expect(await ArkreenMiner.AllManagers(Miner_Manager)).to.equal(manager.address)
      expect(await ArkreenMiner.AllManagers(Register_Authority)).to.equal(register_authority.address)
      expect(await ArkreenMiner.AllManagers(Payment_Receiver)).to.equal(fund_receiver.address)
    })
    it("ArkreenMiner Basics: Withdraw ", async () => {
      // Check only owner
      await expect(ArkreenMiner.connect(owner1).withdraw(AKREToken.address))
              .to.be.revertedWith("Ownable: caller is not the owner")
      // Withdraw to deployer        
      await AKREToken.connect(owner1).transfer(ArkreenMiner.address, expandTo18Decimals(10000))
      const balance0 = await AKREToken.balanceOf(deployer.address)
      await ArkreenMiner.withdraw(AKREToken.address)
      expect(await AKREToken.balanceOf(deployer.address)).to.equal(balance0.add(expandTo18Decimals(10000)));
      
      // withdraw to manager
      await ArkreenMiner.setManager(Payment_Receiver, fund_receiver.address)      
      expect(await AKREToken.balanceOf(fund_receiver.address)).to.equal(0);
      await AKREToken.transfer(ArkreenMiner.address, expandTo18Decimals(10000))
      await ArkreenMiner.withdraw(AKREToken.address)
      expect(await AKREToken.balanceOf(fund_receiver.address)).to.equal(expandTo18Decimals(10000));
      expect(await AKREToken.balanceOf(ArkreenMiner.address)).to.equal(BigNumber.from(0));
    })
    it("ArkreenMiner Basics: Get Miners (RemoteMinerOnboardInBatch)", async () => {
      const receivers = randomAddresses(10)
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(manager).RemoteMinerOnboardInBatch(receivers, miners)
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp
      const minerInfo = [miners[9], MinerType.RemoteMiner, MinerStatus.Normal, timestamp]
      // ID starting from 1
      expect(await ArkreenMiner.AllMinerInfo(10)).to.deep.eq(minerInfo);
    })
    it("ArkreenMiner Basics: Get Miners Address (RemoteMinerOnboardInBatch)", async () => {
      const receivers = randomAddresses(10)
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(manager).RemoteMinerOnboardInBatch(receivers, miners)
      const minerInfo = miners[9]
      expect(await ArkreenMiner.GetMinersAddr(receivers[9])).to.deep.eq([minerInfo]);
    })
/*
    it("ArkreenMiner Basics: Get Miners (Order Miners)", async () => {
      const receiver = owner1.address
      const miners = randomAddresses(3)
      const allPrice = expandTo18Decimals(100).mul(3)
      const nonce = await AKREToken.nonces(receiver)
      const digest = await getApprovalDigest(
                              AKREToken,
                              { owner: receiver, spender: ArkreenMiner.address, value: allPrice },
                              nonce,
                              constants.MaxUint256
                            )
      const { v,r,s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
      const signature: SignatureStruct = { v, r, s, token: AKREToken.address, value:allPrice, deadline: constants.MaxUint256 } 
     
      await ArkreenMiner.connect(manager).OrderMiners(receiver, miners, signature)
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp_push = lastBlock.timestamp
      const minerInfo_0 = [miners[0], MinerType.GameMiner, MinerStatus.Normal, timestamp_push]
      const minerInfo_1 = [miners[1], MinerType.GameMiner, MinerStatus.Normal, timestamp_push]
      const minerInfo_2 = [miners[2], MinerType.GameMiner, MinerStatus.Normal, timestamp_push] 
      expect(await ArkreenMiner.GetMiners(receiver)).to.deep.eq([minerInfo_0, minerInfo_1, minerInfo_2]);
    })
*/
    
/*
    it("ArkreenMiner Basics: Get Miners Address (Order Miners)", async () => {
      const receiver = owner1.address
      const miners = randomAddresses(3)
      const allPrice = expandTo18Decimals(100).mul(3)
      const nonce1 = await AKREToken.nonces(owner1.address)
      const digest1 = await getApprovalDigest(
                              AKREToken,
                              { owner: owner1.address, spender: ArkreenMiner.address, 
                                  value: allPrice },
                              nonce1,
                              constants.MaxUint256
                            )
      const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
      const signature: SignatureStruct = { v, r, s, token: AKREToken.address, value:allPrice, deadline: constants.MaxUint256 } 
     
      await ArkreenMiner.connect(manager).OrderMiners(receiver, miners, signature)
      expect(await ArkreenMiner.GetMinersAddr(receiver)).to.deep.eq(miners);
    })
*/

/*
    it("ArkreenMiner Basics: Update miner status", async () => {
      const receiver = owner1.address
      const miners = randomAddresses(3)
      const allPrice = expandTo18Decimals(100).mul(3)
      const nonce1 = await AKREToken.nonces(owner1.address)
      const digest1 = await getApprovalDigest(
                              AKREToken,
                              { owner: owner1.address, spender: ArkreenMiner.address, 
                                  value: allPrice },
                              nonce1,
                              constants.MaxUint256
                            )
      const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
      const signature: SignatureStruct = { v, r, s, token: AKREToken.address, value:allPrice, deadline: constants.MaxUint256 } 
      await ArkreenMiner.connect(manager).OrderMiners(receiver, miners, signature)
      
      await expect(ArkreenMiner.connect(deployer).SetMinersStatus(2, MinerStatus.Pending))
              .to.be.revertedWith("Arkreen Miner: Wrong Input")
      await expect(ArkreenMiner.connect(owner1).SetMinersStatus(2, MinerStatus.Terminated))
              .to.be.revertedWith("Ownable: caller is not the owner")
      await ArkreenMiner.connect(deployer).SetMinersStatus(2, MinerStatus.Terminated)
    })  
*/

/*
    it("ArkreenMiner Basics: Change airdrop cap", async () => {
      const receivers = randomAddresses(10)
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(deployer).AirdropMiners(receivers, miners)
      expect(await ArkreenMiner.capGameMinerAirdrop()).to.equal(INIT_CAP_AIRDROP)
      // cannot lower than already airdropped game miner numbers
      await expect(ArkreenMiner.connect(deployer).ChangeAirdropCap(9))
              .to.be.revertedWith("Arkreen Miner: Cap Is Lower")
      await ArkreenMiner.connect(deployer).ChangeAirdropCap(20)
      expect(await ArkreenMiner.capGameMinerAirdrop()).to.equal(20)
    }) 
*/    
    
    it("ArkreenMiner Basics: setLaunchTime", async () => {
      // Check only owner
      await expect(ArkreenMiner.connect(owner1).setLaunchTime(FORMAL_LAUNCH))
              .to.be.revertedWith("Ownable: caller is not the owner")
      const lastBlock = await ethers.provider.getBlock('latest')
      await expect(ArkreenMiner.setLaunchTime(lastBlock.timestamp))
              .to.be.revertedWith("Arkreen Miner: Low Timestamp")
      await ArkreenMiner.setLaunchTime(FORMAL_LAUNCH)
      expect (await ArkreenMiner.timestampFormalLaunch()).to.equal(FORMAL_LAUNCH)                
      const receivers = randomAddresses(10)
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(manager).RemoteMinerOnboardInBatch(receivers, miners)
      await time.increaseTo(FORMAL_LAUNCH + 1);
      const receivers_1 = randomAddresses(10)
      const miners_1 = randomAddresses(10)
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardInBatch(receivers_1, miners_1))
              .to.be.revertedWith("Arkreen Miner: Gaming Phase Ended")
    })       

    it("ArkreenMiner Basics: Manage Manufactures", async () => {
      const manufactuers = randomAddresses(10)
      await expect(ArkreenMiner.connect(owner1).ManageManufactures(manufactuers, true))
              .to.be.revertedWith("Ownable: caller is not the owner")        
      await ArkreenMiner.connect(deployer).ManageManufactures(manufactuers, true)
      expect(await ArkreenMiner.AllManufactures(manufactuers[0])).to.equal(true)
      expect(await ArkreenMiner.AllManufactures(manufactuers[9])).to.equal(true)        
      expect(await ArkreenMiner.AllManufactures(maker1.address)).to.equal(false)        
     })     
    
    it("ArkreenMiner Basics: Set Base URI and get token URI", async () => {
      const receivers = randomAddresses(10)
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(manager).RemoteMinerOnboardInBatch(receivers, miners)
      let tokenURI
      tokenURI = await ArkreenMiner.tokenURI(9)
      console.log("tokenURI", tokenURI)
//        await ArkreenMiner.connect(deployer).setBaseURI("https://www.aitos.io/miners/")
//        tokenURI = await ArkreenMiner.tokenURI(9)
//        console.log("tokenURI", tokenURI)
    })  
  })

/*  
  describe("ArkreenMiner: Fresh Game Miner Airdrop", () => {
    it("Airdrop Miners Failed: Not owner", async () => {
      const receivers = randomAddresses(10)
      const miners = randomAddresses(10)
      await expect(ArkreenMiner.connect(owner1).AirdropMiners(receivers, miners))
              .to.be.revertedWith("Ownable: caller is not the owner")
    })
    
    it("Airdrop Miners Failed: Gaming Phase Ended", async () => {
      const receivers = randomAddresses(10)
      const miners = randomAddresses(10)
      await ArkreenMiner.setLaunchTime(FORMAL_LAUNCH)
      await time.increaseTo(FORMAL_LAUNCH + 1);
      await expect(ArkreenMiner.AirdropMiners(receivers, miners))
              .to.be.revertedWith("Arkreen Miner: Gaming Phase Ended")
    })      
    it("Airdrop Miners Failed: receivers and miners are of different length ", async () => {
      const receivers = randomAddresses(9)
      const miners = randomAddresses(10)
      await expect(ArkreenMiner.AirdropMiners(receivers, miners))
              .to.be.revertedWith("Game Miner: Wrong Input")
    })
    it("Airdrop Miners Failed: receivers cannot be contract address", async () => {
      const receivers = randomAddresses(10)
      const miners = randomAddresses(10)
      receivers[9] = AKREToken.address   // contract address
      await expect(ArkreenMiner.AirdropMiners(receivers, miners))
              .to.be.revertedWith("Game Miner: Only EOA Address Allowed")
    })
    it("Airdrop Miners Failed: cannot airdrop two times to the same receiver", async () => {
      const receivers = randomAddresses(2)
      const miners = randomAddresses(2)
      await ArkreenMiner.AirdropMiners(receivers, miners)
      const minersX = randomAddresses(2)
      await expect(ArkreenMiner.AirdropMiners(receivers, minersX))
              .to.be.revertedWith("Game Miner: Airdrop Repeated")
    })
    it("Airdrop Miners Normal", async () => {
      const receivers = randomAddresses(10)
      const miners = randomAddresses(10)
      await expect(ArkreenMiner.AirdropMiners(receivers, miners))
              .to.emit(ArkreenMiner, "GameMinerAirdropped")
              .withArgs(anyValue, miners.length);
      expect(await ArkreenMiner.counterGameMinerAirdrop()).to.equal(miners.length);
      expect(await ArkreenMiner.GetPendingGameNumber()).to.equal(miners.length);
      expect(await ArkreenMiner.totalGameMiner()).to.equal(miners.length);
      expect(await ArkreenMiner.totalSupply()).to.equal(miners.length);
      expect(await ArkreenMiner.balanceOf(receivers[0])).to.equal(1);
      expect(await ArkreenMiner.balanceOf(receivers[9])).to.equal(1);
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp + DURATION_ACTIVATE
      const miner0 = [miners[0], MinerType.GameMiner, MinerStatus.Pending, timestamp]
      const miner9 = [miners[9], MinerType.GameMiner, MinerStatus.Pending, timestamp]
      // ID is starting from 1
      expect(await ArkreenMiner.AllMinerInfo(1)).to.deep.eq(miner0);
      expect(await ArkreenMiner.AllMinerInfo(10)).to.deep.eq(miner9);
    })
  })

  describe("ArkreenMiner: Game miners cannot be transferred", () => {
    beforeEach(async () => {
      const receivers = randomAddresses(10)
      const miners = randomAddresses(10)
      receivers[9] = owner1.address
      await ArkreenMiner.connect(deployer).AirdropMiners(receivers, miners)
    });
    it("Airdrop Miners Failed: Game miners transfer failed", async () => {
      const tokenID = await ArkreenMiner.tokenOfOwnerByIndex(owner1.address, 0)
      await expect(ArkreenMiner.connect(owner1).transferFrom(owner1.address, owner2.address,tokenID))
              .to.be.revertedWith("Arkreen Miner: Game Miner Transfer Not Allowed")
    })
    it("Airdrop Miners Failed: Caller is not token owner", async () => {
      const tokenID = await ArkreenMiner.tokenOfOwnerByIndex(owner1.address, 0)
      await expect(ArkreenMiner.connect(deployer).transferFrom(owner1.address, owner2.address,tokenID))
              .to.be.revertedWith("ERC721: caller is not token owner nor approved")
    })      
  })
*/  

/*
  describe("ArkreenMiner: Re-Airdrop pending game miners to new receivers", () => {
    const receivers_0 = randomAddresses(10)
    const miners_0 = randomAddresses(10)
    beforeEach(async () => {
      await ArkreenMiner.connect(deployer).AirdropMiners(receivers_0, miners_0)
    });
    it("Re-Airdrop Miners Failed 1: Receivers and miners are of different length ", async () => {
      const receivers = randomAddresses(10)
      const miners: string[] = []
      await expect(ArkreenMiner.connect(deployer).AirdropMiners(receivers, miners))
              .to.be.revertedWith("Game Miner: Airdrop Not Full")
    })
    it("Re-Airdrop Miners Failed 2: No enough game miner passed the claim time limit", async () => {
      const receivers = randomAddresses(6)
      const miners: string[] = []
      receivers[5] = AKREToken.address                                // contract address
      await ArkreenMiner.connect(deployer).ChangeAirdropCap(10)       // set the cap to be full
      await expect(ArkreenMiner.connect(deployer).AirdropMiners(receivers, miners))
              .to.be.revertedWith("Game Miner: Two Much Airdrop")
    })
    it("Re-Airdrop Miners Failed 3: Receivers cannot be contract address", async () => {
      const receivers = randomAddresses(6)
      const miners: string[] = []
      receivers[5] = AKREToken.address                                // contract address
      await ArkreenMiner.connect(deployer).ChangeAirdropCap(10)       // set the cap to be full
      await network.provider.send("evm_increaseTime", [DURATION_ACTIVATE]);
      await expect(ArkreenMiner.connect(deployer).AirdropMiners(receivers, miners))
              .to.be.revertedWith("Game Miner: Only EOA Address Allowed")
    })
    it("Re-Airdrop Miners Failed 4: Cannot airdrop two times to the same receiver", async () => {
      const receivers = randomAddresses(2)
      const miners: string[] = []
      await ArkreenMiner.connect(deployer).ChangeAirdropCap(10)       // set the cap to be full    
      await network.provider.send("evm_increaseTime", [DURATION_ACTIVATE]);    
      await ArkreenMiner.connect(deployer).AirdropMiners(receivers, miners)
      await expect(ArkreenMiner.connect(deployer).AirdropMiners(receivers, miners))
              .to.be.revertedWith("Game Miner: Airdrop Repeated")
    })      
    it("Re-Airdrop Miners Failed 5: receivers cannot be contract address", async () => {
      const receivers = randomAddresses(11)
      const miners: string[] = []
      await ArkreenMiner.connect(deployer).ChangeAirdropCap(10)       // set the cap to be full
      await expect(ArkreenMiner.connect(deployer).AirdropMiners(receivers, miners))
              .to.be.revertedWith("Game Miner: Two Much Airdrop Receiver")
    })
    it("Re-Airdrop Miners Normal", async () => {
      const receivers = randomAddresses(10)
      const miners: string[] = []
      await ArkreenMiner.connect(deployer).ChangeAirdropCap(10)       // set the cap to be full    
      await network.provider.send("evm_increaseTime", [DURATION_ACTIVATE]);    
      await expect(ArkreenMiner.connect(deployer).AirdropMiners(receivers, miners))
              .to.emit(ArkreenMiner, "GameMinerAirdropped")
              .withArgs(anyValue, receivers.length);
      expect(await ArkreenMiner.counterGameMinerAirdrop()).to.equal(receivers.length);
      expect(await ArkreenMiner.GetPendingGameNumber()).to.equal(receivers.length);
      expect(await ArkreenMiner.totalGameMiner()).to.equal(receivers.length);
      expect(await ArkreenMiner.totalSupply()).to.equal(receivers.length);
      expect(await ArkreenMiner.balanceOf(receivers[0])).to.equal(1);
      expect(await ArkreenMiner.balanceOf(receivers[9])).to.equal(1);
      expect(await ArkreenMiner.balanceOf(receivers[0])).to.equal(1);
      expect(await ArkreenMiner.balanceOf(receivers[9])).to.equal(1);
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp + DURATION_ACTIVATE
      const miner0 = [miners_0[0], MinerType.GameMiner, MinerStatus.Pending, timestamp]
      const miner9 = [miners_0[9], MinerType.GameMiner, MinerStatus.Pending, timestamp]
      expect(await ArkreenMiner.AllMinerInfo(1)).to.deep.eq(miner0);
      expect(await ArkreenMiner.AllMinerInfo(10)).to.deep.eq(miner9);
    })
  })
*/

/*
  describe("ArkreenMiner: Order miners and mint game miners to the receiver", () => {
    const receivers_0 = randomAddresses(10)
    const miners_0 = randomAddresses(10)
    let signature: SignatureStruct
    beforeEach(async () => {
      await ArkreenMiner.connect(deployer).AirdropMiners(receivers_0, miners_0)
      const allPrice = expandTo18Decimals(100).mul(10)
      const nonce = await AKREToken.nonces(owner1.address)
      const digest = await getApprovalDigest(
                              AKREToken,
                              { owner: owner1.address, spender: ArkreenMiner.address, value: allPrice },
                              nonce,
                              constants.MaxUint256
                            )
      const { v,r,s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
      signature = { v, r, s, token: AKREToken.address, value:allPrice, deadline: constants.MaxUint256 }         
    });
    it("Order Game Miners Failed: Not miner manager", async () => {
      const receiver = owner1.address
      const miners = randomAddresses(10)
      await expect(ArkreenMiner.connect(owner1).OrderMiners(receiver, miners, signature))
              .to.be.revertedWith("Arkreen Miner: Not Miner Manager")
    })
    it("Order Game Miners Failed: Not valid signature", async () => {
      const receiver = owner2.address           // non-identical address
      const miners = randomAddresses(10)
      await expect(ArkreenMiner.connect(manager).OrderMiners(receiver, miners, signature))
              .to.be.revertedWith("ERC20Permit: invalid signature")
    })      
    it("Order Game Miners Failed: Formal launched, game miners not allowed", async () => {
      const receiver = owner1.address
      const miners = randomAddresses(10)
      await ArkreenMiner.setLaunchTime(FORMAL_LAUNCH)
      await time.increaseTo(FORMAL_LAUNCH + 1)
      await expect(ArkreenMiner.connect(manager).OrderMiners(receiver, miners, signature))
              .to.be.revertedWith("Arkreen Miner: Game Miner Not Allowed")
    })  
    it("Order Game Miners Failed 2: Not input game miners", async () => {
      const receiver = owner1.address
      await expect(ArkreenMiner.connect(manager).OrderMiners(receiver, [], signature))
              .to.be.revertedWith("Arkreen Miner: Null Game Miner")
    })      
    it("Order Game Miners: Normal pre-formal launch", async () => {
      const receiver = owner1.address
      const miners = randomAddresses(10)
      await expect(ArkreenMiner.connect(manager).OrderMiners(receiver, miners, signature))
              .to.emit(ArkreenMiner, "GameMinerOnboarded")
              .withArgs(receiver, miners)
              .to.emit(AKREToken, "Transfer")
              .withArgs(owner1.address, ArkreenMiner.address, expandTo18Decimals(100).mul(10))                
      expect(await ArkreenMiner.totalGameMiner()).to.equal(miners_0.length + miners.length)
      expect(await ArkreenMiner.totalSupply()).to.equal(miners_0.length + miners.length)
      expect(await ArkreenMiner.balanceOf(receiver)).to.equal(miners.length);
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp
      const miner0 = [miners[0], MinerType.GameMiner, MinerStatus.Normal, timestamp]
      const miner9 = [miners[9], MinerType.GameMiner, MinerStatus.Normal, timestamp]
      const minerNFT0 = await ArkreenMiner.tokenOfOwnerByIndex(receiver, 0)
      const minerNFT9 = await ArkreenMiner.tokenOfOwnerByIndex(receiver, 9)        
      expect(await ArkreenMiner.AllMinerInfo(minerNFT0)).to.deep.eq(miner0)
      expect(await ArkreenMiner.AllMinerInfo(minerNFT9)).to.deep.eq(miner9)
    })
    it("Order Game Miners: Normal order miners post-formal launch", async () => {
      const receiver = owner1.address
      await ArkreenMiner.setLaunchTime(FORMAL_LAUNCH)
      await time.increaseTo(FORMAL_LAUNCH + 1);        
      await expect(ArkreenMiner.connect(manager).OrderMiners(receiver, [], signature))
              .to.emit(AKREToken, "Transfer")
              .withArgs(owner1.address, ArkreenMiner.address, expandTo18Decimals(100).mul(10))
    })
  })
*/

  describe("ArkreenMiner: Onbording a game miner", () => {
    const receivers = randomAddresses(10)
    const miners = randomAddresses(10)
//    beforeEach(async () => {
//      await ArkreenMiner.connect(manager).RemoteMinerOnboardInBatch(receivers, miners)
//    });
    it("Onboarding Game Miner Failed 1: Signature Deadline checking ", async () => {
      const receiver = receivers[9]
      const miner = AKREToken.address
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp
      const digest = getOnboardingGameMinerDigest(
        'Arkreen Miner',
        ArkreenMiner.address,
        { owner: receiver, miner: miner, bAirDrop: false },
         BigNumber.from(timestamp + 600)
      )
      await network.provider.send("evm_increaseTime", [601]);
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))        
//      const signataure = await deployer.signMessage(Buffer.from(digest.slice(2), 'hex'))
//      const {v, r, s}  = fromRpcSig(signataure)
//      const signature: SignatureStruct = { v, r, s, feeRegister, deadline: BigNumber.from(timestamp + 600) }  
      const signature: SigStruct = { v, r, s }  
     
      await expect(ArkreenMiner.connect(owner1).GameMinerOnboard(receiver, miner, false, BigNumber.from(timestamp + 600), signature))
              .to.be.revertedWith("Arkreen Miner: EXPIRED")
    })
    it("Onboarding Game Miner Failed 2: Gaming Phase Ended", async () => {
      const receiver = receivers[9]
      const miner = miners[9]
      const digest = getOnboardingGameMinerDigest(
        'Arkreen Miner',
        ArkreenMiner.address,
        { owner: receiver, miner: miner, bAirDrop: false },
        constants.MaxUint256
      )
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))
      const signature: SigStruct = { v, r, s }  
      await ArkreenMiner.setLaunchTime(FORMAL_LAUNCH)
      await time.increaseTo(FORMAL_LAUNCH + 1);
      await expect(ArkreenMiner.connect(owner1).GameMinerOnboard(receiver, miner, false, constants.MaxUint256, signature))
              .to.be.revertedWith("Arkreen Miner: Gaming Phase Ended")
    })  
    it("Onboarding Game Miner Failed 3: Game miner address checking ", async () => {
      const receiver = receivers[9]
      const miner = AKREToken.address                   // wrong address
      const digest = getOnboardingGameMinerDigest(
        'Arkreen Miner',
        ArkreenMiner.address,
        { owner: receiver, miner: miner, bAirDrop: false },
        constants.MaxUint256
      )
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))        
      const signature: SigStruct = { v, r, s }  
      
      await expect(ArkreenMiner.connect(owner1).GameMinerOnboard(receiver, miner, false, constants.MaxUint256, signature))
              .to.be.revertedWith("Game Miner: Not EOA Address")
    })
    it("Onboarding Game Miner Failed 4: Signature checking", async () => {
      const receiver = receivers[9]
      const miner = miners[9]
      const digest = getOnboardingGameMinerDigest(
        'Arkreen Miner',
        ArkreenMiner.address,
        { owner: receiver, miner: miner, bAirDrop: true },
        constants.MaxUint256
      )
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))
      const signature: SigStruct = { v, r, s }  
      
      await expect(ArkreenMiner.connect(owner1).GameMinerOnboard(receiver, miner, false, constants.MaxUint256, signature))
              .to.be.revertedWith("Game Miner: INVALID_SIGNATURE")
    })
/*    
    it("Onboarding Game Miner Failed 5: No Game Miner To Board", async () => {
      const receiver = owner1.address
      const miner = miners[9]

      const digest = getOnboardingGameMinerDigest(
        'Arkreen Miner',
        ArkreenMiner.address,
        { owner: receiver, miner: miner, bAirDrop: true },
        constants.MaxUint256
      )
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyRegister.slice(2), 'hex'))
//        const message = getOnboardingGameMinerMessage(
//          'Arkreen Miner',
//          ArkreenMiner.address,
//          { owner: receiver, miner: miner, bAirDrop: true },
//          constants.MaxUint256
//        )
//        const signataure = await deployer.signMessage(ethers.utils.arrayify(message))
//        const {v, r, s}  = fromRpcSig(signataure)
//        const recoveredAddress = ethers.utils.verifyMessage(ethers.utils.arrayify(message), signataure);   
//        console.log("recoveredAddress, deployer.address", recoveredAddress, deployer.address)
      const signature: SigStruct = { v, r, s }  
      
      await expect(ArkreenMiner.connect(owner1).GameMinerOnboard(receiver, miner, true, constants.MaxUint256, signature))
              .to.be.revertedWith("Game Miner: No Miner To Board")
    })
*/

/*    
    it("Onboarding Game Miner Failed 6: Wrong miner address", async () => {
      const receiver = receivers[9]
      const miner = miners[8]                       // Wrong miner address
      const digest = getOnboardingGameMinerDigest(
        'Arkreen Miner',
        ArkreenMiner.address,
        { owner: receiver, miner: miner, bAirDrop: true },
        constants.MaxUint256
      )
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyRegister.slice(2), 'hex'))        
      const signature: SigStruct = { v, r, s }  
      
      await expect(ArkreenMiner.connect(owner1).GameMinerOnboard(receiver, miner, true, constants.MaxUint256, signature))
              .to.be.revertedWith("Game Miner: Wrong Miner Address")
    })
*/

    it("Onboarding Game Miner Failed 7: Onboarding a new one while holding a game miner", async () => {
      const receiver = receivers[9]
      const miners = randomAddresses(5)
      const digest = getOnboardingGameMinerDigest(
                      'Arkreen Miner',
                      ArkreenMiner.address,
                      { owner: receiver, miner: miners[4], bAirDrop: false },
                      constants.MaxUint256
                    )
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyRegister.slice(2), 'hex'))           
      const signature0: SigStruct = { v, r, s } 
      
      await ArkreenMiner.connect(owner1).GameMinerOnboard(receiver, miners[4], false, constants.MaxUint256, signature0)

      const digest2 = getOnboardingGameMinerDigest(
                'Arkreen Miner',
                ArkreenMiner.address,
                { owner: receiver, miner: miners[4], bAirDrop: false },
                constants.MaxUint256
              )              
      const {v:v2, r:r2,s:s2} = ecsign(Buffer.from(digest2.slice(2), 'hex'), Buffer.from(privateKeyRegister.slice(2), 'hex'))           
      const signature2: SigStruct = { v:v2, r:r2, s:s2 } 

      await expect(ArkreenMiner.connect(owner1).GameMinerOnboard(receiver, miners[4], false, constants.MaxUint256, signature2))
              .to.be.revertedWith("Game Miner: Holding Game Miner")              
    })

    it("Onboarding Game Miner Failed 8: game miner repeated", async () => {
      // Normal case 
      const owners = randomAddresses(5)
      const miners = randomAddresses(5)
      await ArkreenMiner.connect(manager).RemoteMinerOnboardInBatch(owners, miners)

      const receiver = receivers[9]
      const digest = getOnboardingGameMinerDigest(
                      'Arkreen Miner',
                      ArkreenMiner.address,
                      { owner: receiver, miner: miners[4], bAirDrop: false },
                      constants.MaxUint256
                    )
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyRegister.slice(2), 'hex'))           
      const signature0: SigStruct = { v, r, s } 
      
      await expect(ArkreenMiner.connect(owner1).GameMinerOnboard(receiver, miners[4], false, constants.MaxUint256, signature0))
              .to.be.revertedWith("Game Miner: Miner Repeated")    
    })
/*
    it("Onboarding Game Miner: Onboarding the airdropped game miner", async () => {
      const receiver = receivers[9]
      const miner = miners[9]
      const digest = getOnboardingGameMinerDigest(
        'Arkreen Miner',
        ArkreenMiner.address,
        { owner: receiver, miner: miner, bAirDrop: true },
        constants.MaxUint256
      )
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyRegister.slice(2), 'hex'))
      const signature: SigStruct = { v, r, s }  
      
      const numbPendingGameMiners =  await ArkreenMiner.GetPendingGameNumber()
      await expect(ArkreenMiner.connect(owner1).GameMinerOnboard(receiver, miner, true, constants.MaxUint256, signature))
              .to.emit(ArkreenMiner, "GameMinerOnboarded")
              .withArgs(receiver, [miner]);
      expect(await ArkreenMiner.GetPendingGameNumber()).to.equal(numbPendingGameMiners.sub(1))
      expect(await ArkreenMiner.totalGameMiner()).to.equal(miners.length);
      expect(await ArkreenMiner.totalSupply()).to.equal(miners.length);
      expect(await ArkreenMiner.balanceOf(receiver)).to.equal(1);
      
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp
      const minerInfo = [miner, MinerType.GameMiner, MinerStatus.Normal, timestamp]
      const minerNFT = await ArkreenMiner.tokenOfOwnerByIndex(receiver, 0)
      expect(await ArkreenMiner.AllMinerInfo(minerNFT)).to.deep.eq(minerInfo);
    })
*/

    it("Onboarding Game Miner: Onboarding an new game miner", async () => {
      const receiver = randomAddresses(1)[0]
      const miner = randomAddresses(1)[0]
      const digest = getOnboardingGameMinerDigest(
        'Arkreen Miner',
        ArkreenMiner.address,
        { owner: receiver, miner: miner, bAirDrop: false },
        constants.MaxUint256
      )
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyRegister.slice(2), 'hex'))
      const signature: SigStruct = { v, r, s }  
      
      const numbPendingGameMiners =  await ArkreenMiner.GetPendingGameNumber()
      await expect(ArkreenMiner.connect(owner1).GameMinerOnboard(receiver, miner, false, constants.MaxUint256, signature))
              .to.emit(ArkreenMiner, "GameMinerOnboarded")
              .withArgs(receiver, [miner]);
      expect(await ArkreenMiner.GetPendingGameNumber()).to.equal(numbPendingGameMiners)
      expect(await ArkreenMiner.totalGameMiner()).to.equal(1);
      expect(await ArkreenMiner.totalSupply()).to.equal(1);
      expect(await ArkreenMiner.balanceOf(receiver)).to.equal(1);
      
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp
      const minerInfo = [miner, MinerType.GameMiner, MinerStatus.Normal, timestamp]
      const minerNFT = await ArkreenMiner.tokenOfOwnerByIndex(receiver, 0)
      expect(await ArkreenMiner.AllMinerInfo(minerNFT)).to.deep.eq(minerInfo);
    })
  })

  describe("ArkreenMiner: Onbording a standard miner", () => {
    const receivers = randomAddresses(10)
    const miners = randomAddresses(10)

    it("Onboarding standard Miner Failed 1: Signature Deadline checking ", async () => {
      const receiver = receivers[9]
      const miner = miners[9]
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp
      const digest = getOnboardingStandardMinerDigest(
        'Arkreen Miner',
        ArkreenMiner.address,
        { owner: receiver, miner: miner },
         BigNumber.from(timestamp + 600)
      )
      await network.provider.send("evm_increaseTime", [601]);
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))        
      const signature: SigStruct = { v, r, s }  
     
      await expect(ArkreenMiner.connect(owner1).StandardMinerOnboard(receiver, miner, BigNumber.from(timestamp + 600), signature))
              .to.be.revertedWith("Arkreen Miner: EXPIRED")
    })

    it("Onboarding standard Miner Failed 2: standard miner address checking ", async () => {
      const receiver = receivers[9]
      const miner = AKREToken.address                   // wrong address
      const digest = getOnboardingStandardMinerDigest(
        'Arkreen Miner',
        ArkreenMiner.address,
        { owner: receiver, miner: miner},
        constants.MaxUint256
      )
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))        
      const signature: SigStruct = { v, r, s }  
      
      await expect(ArkreenMiner.connect(owner1).StandardMinerOnboard(receiver, miner, constants.MaxUint256, signature))
              .to.be.revertedWith("Arkreen Miner: Not EOA Address")
    })

    it("Onboarding standard Miner Failed 3: standard miner repeated", async () => {
      // Normal case 
      const owners = randomAddresses(5)
      const miners = randomAddresses(5)
      await ArkreenMiner.connect(manager).RemoteMinerOnboardInBatch(owners, miners)

      const receiver = receivers[9]
      const digest = getOnboardingStandardMinerDigest(
                      'Arkreen Miner',
                      ArkreenMiner.address,
                      { owner: receiver, miner: miners[4] },
                      constants.MaxUint256
                    )
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyRegister.slice(2), 'hex'))           
      const signature0: SigStruct = { v, r, s } 
      
      await expect(ArkreenMiner.connect(owner1).StandardMinerOnboard(receiver, miners[4], constants.MaxUint256, signature0))
              .to.be.revertedWith("Arkreen Miner: Miner Repeated")    
    })       

    it("Onboarding standard Miner Failed 4: Signature checking", async () => {
      const receiver = receivers[9]
      const miner = miners[9]
      const digest = getOnboardingStandardMinerDigest(
        'Arkreen Miner',
        ArkreenMiner.address,
        { owner: receiver, miner: miner },
        constants.MaxUint256
      )
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))
      const signature: SigStruct = { v, r, s }  
      
      await ArkreenMiner.connect(manager).UpdateMinerWhiteList(MinerType.StandardMiner, miners) 
      await expect(ArkreenMiner.connect(owner1).StandardMinerOnboard(receiver, miner, constants.MaxUint256, signature))
              .to.be.revertedWith("Arkreen Miner: INVALID_SIGNATURE")
    })

    it("Onboarding standard Miner: Onboarding an new standard miner", async () => {
      const receiver = receivers[3]
      const miner = miners[3]
      const digest = getOnboardingStandardMinerDigest(
        'Arkreen Miner',
        ArkreenMiner.address,
        { owner: receiver, miner: miner},
        constants.MaxUint256
      )
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyRegister.slice(2), 'hex'))
      const signature: SigStruct = { v, r, s }  
      
      await ArkreenMiner.connect(manager).UpdateMinerWhiteList(MinerType.StandardMiner, miners)       
      await expect(ArkreenMiner.connect(owner1).StandardMinerOnboard(receiver, miner, constants.MaxUint256, signature))
              .to.emit(ArkreenMiner, "StandardMinerOnboarded")
              .withArgs(receiver, miner);
      expect(await ArkreenMiner.totalStandardMiner()).to.equal(1);
      expect(await ArkreenMiner.totalSupply()).to.equal(1);
      expect(await ArkreenMiner.balanceOf(receiver)).to.equal(1);
      
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp
      const minerInfo = [miner, MinerType.StandardMiner, MinerStatus.Normal, timestamp]
      const minerNFT = await ArkreenMiner.tokenOfOwnerByIndex(receiver, 0)
      expect(await ArkreenMiner.AllMinerInfo(minerNFT)).to.deep.eq(minerInfo);
    })
  })

  describe("ArkreenMiner: Update Miner White List", () => {
    it("UpdateMinerWhiteList: ", async () => {
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(manager).UpdateMinerWhiteList(MinerType.RemoteMiner, miners) 
      expect(await ArkreenMiner.whiteListMiner(miners[1])).to.deep.eq(MinerType.RemoteMiner);
      expect(await ArkreenMiner.whiteListMiner(miners[9])).to.deep.eq(MinerType.RemoteMiner);

      await ArkreenMiner.connect(manager).UpdateMinerWhiteList(0xFF, [miners[5], miners[6]]) 
      expect(await ArkreenMiner.whiteListMiner(miners[4])).to.deep.eq(MinerType.RemoteMiner);
      expect(await ArkreenMiner.whiteListMiner(miners[5])).to.deep.eq(0);
      expect(await ArkreenMiner.whiteListMiner(miners[6])).to.deep.eq(0);
      expect(await ArkreenMiner.whiteListMiner(miners[7])).to.deep.eq(MinerType.RemoteMiner);   
      
      await expect(ArkreenMiner.connect(manager).UpdateMinerWhiteList(MinerType.RemoteMiner, [miners[5], constants.AddressZero])).
              to.be.revertedWith("Arkreen Miner: Wrong Address") 
      
      await expect(ArkreenMiner.connect(manager).UpdateMinerWhiteList(MinerType.RemoteMiner, [miners[5], AKREToken.address])).
              to.be.revertedWith("Arkreen Miner: Wrong Address") 

      await expect(ArkreenMiner.connect(manager).UpdateMinerWhiteList(MinerType.RemoteMiner, [miners[4], miners[5]])).
              to.be.revertedWith("Arkreen Miner: Miners Repeated") 
    }) 
  })

  describe("ArkreenMiner: Onbording a Remote miner", () => {
    const receivers = randomAddresses(10)
    const miners = randomAddresses(10)
    const receiver = randomAddresses(1)[0]
    const gameMiner = constants.AddressZero
    let DTUMiner = miners[9]
    let payer: string
    const feeRegister = expandTo18Decimals(100)
    let signature: SignatureStruct
    let sig: SigStruct

    beforeEach(async () => {
      payer = maker1.address
      const nonce = await AKREToken.nonces(payer)
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp
      const digest = await getApprovalDigest(
        AKREToken,
        { owner: payer, spender: ArkreenMiner.address, value: feeRegister },
        nonce,
        BigNumber.from(timestamp + 600)
      )
      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyMaker.slice(2), 'hex'))
      signature = { v, r, s, token: AKREToken.address, value:feeRegister, deadline: BigNumber.from(timestamp + 600) } 
      sig = {v,r,s}

    });
    it("Onboarding Remote Miner Failed 1: Signature deadline checking ", async () => {
      await network.provider.send("evm_increaseTime", [601]);
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboard(receiver, DTUMiner, sig, signature))        
              .to.be.revertedWith("Arkreen Miner: EXPIRED")
    })      

    it("Onboarding Remote Miner Failed 2: Miner not white-listed ", async () => {
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboard(receiver, DTUMiner, sig, signature))        
              .to.be.revertedWith("Arkreen Miner: Wrong Miner")
    })

    it("Onboarding Remote Miner Failed 3: Manager Signature checking", async () => {
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(manager).UpdateMinerWhiteList(MinerType.RemoteMiner, miners) 
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboard(receiver, miners[1], sig, signature))          
              .to.be.revertedWith("Arkreen Miner: INVALID_SIGNATURE")
    })

    it("Onboarding Remote Miner: Onboarding a Remote miner", async () => {
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(manager).UpdateMinerWhiteList(MinerType.RemoteMiner, miners) 
      const minerPrice = expandTo18Decimals(2000)

      const receiver = owner1.address
      const register_digest = getOnboardingRemoteMinerDigest(
                      'Arkreen Miner',
                      ArkreenMiner.address,
                      { owner: owner1.address, miner: miners[1], 
                        token: AKREToken.address, price: minerPrice, deadline: constants.MaxUint256 }
                    )
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      const {v: rv, r: rr, s: rs} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                            Buffer.from(privateKeyRegister.slice(2), 'hex'))           
      const sig: SigStruct = { v: rv, r: rr, s: rs }

      const nonce = await AKREToken.nonces(receiver)
      const digest = await getApprovalDigest(
                              AKREToken,
                              { owner: receiver, spender: ArkreenMiner.address, value: minerPrice },
                              nonce,
                              constants.MaxUint256
                            )
      const { v,r,s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
      const signature: SignatureStruct = { v, r, s, token: AKREToken.address, value:minerPrice, deadline: constants.MaxUint256 } 

      const signature_err: SignatureStruct = { ...signature, s: rs } 
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboard(receiver, miners[1], sig, signature_err))          
              .to.be.revertedWith("ERC20Permit: invalid signature")

      const balanceARKE = await AKREToken.balanceOf(owner1.address)
      const balanceArkreenMiner = await AKREToken.balanceOf(ArkreenMiner.address)

      await expect(ArkreenMiner.connect(owner1).RemoteMinerOnboard(receiver,  miners[1], sig, signature))
              .to.emit(AKREToken, "Transfer")
              .withArgs(owner1.address, ArkreenMiner.address, minerPrice)
              .to.emit(ArkreenMiner, "MinerOnboarded")
              .withArgs(receiver, miners[1]);
      expect(await AKREToken.balanceOf(owner1.address)).to.equal(balanceARKE.sub(minerPrice));
      expect(await AKREToken.balanceOf(ArkreenMiner.address)).to.equal(balanceArkreenMiner.add(minerPrice));
      expect(await ArkreenMiner.totalSupply()).to.equal(1);
      expect(await ArkreenMiner.balanceOf(receiver)).to.equal(1);

      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp
      const minerInfo = [miners[1], MinerType.RemoteMiner, MinerStatus.Normal, timestamp]
      const minerNFT = await ArkreenMiner.tokenOfOwnerByIndex(receiver, 0)
      expect(await ArkreenMiner.AllMinerInfo(minerNFT)).to.deep.eq(minerInfo);
      expect(await ArkreenMiner.AllMinersToken(miners[1])).to.deep.eq(minerNFT);
      expect(await ArkreenMiner.whiteListMiner(miners[1])).to.deep.eq(0);
    })
  })

  describe("ArkreenMiner: Onbording a Remote miner while payment has already been approved.", () => {
    const miners = randomAddresses(10)
    const receiver = randomAddresses(1)[0]
    let DTUMiner = miners[9]
    let payer: string
    let signature: SignatureStruct

    const minerPrice = expandTo18Decimals(2000)

    beforeEach(async () => {
      payer = maker1.address
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp

      const register_digest = getOnboardingRemoteMinerDigest(
                      'Arkreen Miner',
                      ArkreenMiner.address,
                      { owner: owner1.address, miner: miners[1], 
                        token: AKREToken.address, price: minerPrice, deadline: BigNumber.from(timestamp + 600) }
                    )
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      const {v, r, s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                            Buffer.from(privateKeyRegister.slice(2), 'hex'))           
      signature = { v, r, s, token: AKREToken.address, value:minerPrice, deadline: BigNumber.from(timestamp + 600) } 

    });

    it("Onboarding Remote Miner Failed 1: Signature deadline checking ", async () => {
      await network.provider.send("evm_increaseTime", [601]);
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardApproved(receiver, DTUMiner, signature))        
              .to.be.revertedWith("Arkreen Miner: EXPIRED")
    })      

    it("Onboarding Remote Miner Failed 2: Miner not white-listed ", async () => {
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardApproved(receiver, DTUMiner, signature))        
              .to.be.revertedWith("Arkreen Miner: Wrong Miner")
    })

    it("Onboarding Remote Miner Failed 3: Manager Signature checking", async () => {
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(manager).UpdateMinerWhiteList(MinerType.RemoteMiner, miners) 
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardApproved(receiver, miners[1], signature))          
              .to.be.revertedWith("Arkreen Miner: INVALID_SIGNATURE")
    })

    it("Onboarding Remote Miner: Onboarding a Remote miner", async () => {
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(manager).UpdateMinerWhiteList(MinerType.RemoteMiner, miners) 
      const minerPrice = expandTo18Decimals(2000)

      const receiver = owner1.address
      const register_digest = getOnboardingRemoteMinerDigest(
                      'Arkreen Miner',
                      ArkreenMiner.address,
                      { owner: owner1.address, miner: miners[1], 
                        token: AKREToken.address, price: minerPrice, deadline: constants.MaxUint256 }
                    )
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                            Buffer.from(privateKeyRegister.slice(2), 'hex'))           
      const signature: SignatureStruct = { v, r, s, token: AKREToken.address, value:minerPrice, deadline: constants.MaxUint256 } 

      const signature_err: SignatureStruct = { ...signature, s: r } 
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardApproved(receiver, miners[1], signature_err))          
              .to.be.revertedWith("Arkreen Miner: INVALID_SIGNATURE")

      const balanceARKE = await AKREToken.balanceOf(owner1.address)
      const balanceArkreenMiner = await AKREToken.balanceOf(ArkreenMiner.address)

      await expect(ArkreenMiner.connect(owner1).RemoteMinerOnboardApproved(receiver,  miners[1], signature))
              .to.emit(AKREToken, "Transfer")
              .withArgs(owner1.address, ArkreenMiner.address, minerPrice)
              .to.emit(ArkreenMiner, "MinerOnboarded")
              .withArgs(receiver, miners[1]);

      expect(await AKREToken.balanceOf(owner1.address)).to.equal(balanceARKE.sub(minerPrice));
      expect(await AKREToken.balanceOf(ArkreenMiner.address)).to.equal(balanceArkreenMiner.add(minerPrice));
      expect(await ArkreenMiner.totalSupply()).to.equal(1);
      expect(await ArkreenMiner.balanceOf(receiver)).to.equal(1);

      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp
      const minerInfo = [miners[1], MinerType.RemoteMiner, MinerStatus.Normal, timestamp]
      const minerNFT = await ArkreenMiner.tokenOfOwnerByIndex(receiver, 0)
      expect(await ArkreenMiner.AllMinerInfo(minerNFT)).to.deep.eq(minerInfo);
      expect(await ArkreenMiner.AllMinersToken(miners[1])).to.deep.eq(minerNFT);
      expect(await ArkreenMiner.whiteListMiner(miners[1])).to.deep.eq(0);
    })
  })


  describe("ArkreenMiner: Onbording a Remote miner paying with MATIC", () => {
    const miners = randomAddresses(10)
    const receiver = randomAddresses(1)[0]
    let DTUMiner = miners[9]
    let payer: string
    let signature: SignatureStruct

    const minerPrice = expandTo18Decimals(10)

    beforeEach(async () => {
      payer = maker1.address
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp

      const register_digest = getOnboardingRemoteMinerDigest(
                      'Arkreen Miner',
                      ArkreenMiner.address,
                      { owner: owner1.address, miner: miners[1], 
                        token: AKREToken.address, price: minerPrice, deadline: BigNumber.from(timestamp + 600) }
                    )
      await ArkreenMiner.setManager(Register_Authority, register_authority.address)
      const {v, r, s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                            Buffer.from(privateKeyRegister.slice(2), 'hex'))           
      signature = { v, r, s, token: AKREToken.address, value: minerPrice, deadline: BigNumber.from(timestamp + 600) } 
    });

    it("Onboarding Remote Miner Failed 1: Signature deadline checking ", async () => {
      await network.provider.send("evm_increaseTime", [601]);
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardNative(receiver, DTUMiner, signature))        
              .to.be.revertedWith("Arkreen Miner: EXPIRED")
    })      

    it("Onboarding Remote Miner Failed 2: Arkreen Miner: Payment error", async () => {
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardNative(receiver, DTUMiner, signature, {value: minerPrice.div(2)}))        
              .to.be.revertedWith("Arkreen Miner: Payment error")
    })

    it("Onboarding Remote Miner Failed 3: Miner not white-listed ", async () => {
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardNative(receiver, DTUMiner, signature, {value: minerPrice}))        
              .to.be.revertedWith("Arkreen Miner: Wrong Miner")
    })

    it("Onboarding Remote Miner Failed 4: Manager Signature checking", async () => {
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(manager).UpdateMinerWhiteList(MinerType.RemoteMiner, miners) 
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardNative(receiver, miners[1], signature, {value: minerPrice}))          
              .to.be.revertedWith("Arkreen Miner: INVALID_SIGNATURE")
    })

    it("Onboarding Remote Miner: Onboarding a Remote miner", async () => {
      const miners = randomAddresses(10)
      await ArkreenMiner.connect(manager).UpdateMinerWhiteList(MinerType.RemoteMiner, miners) 
      const minerPrice = expandTo18Decimals(2000)

      const receiver = owner1.address
      const register_digest = getOnboardingRemoteMinerDigest(
                      'Arkreen Miner',
                      ArkreenMiner.address,
                      { owner: owner1.address, miner: miners[1], 
                        token: AKREToken.address, price: minerPrice, deadline: constants.MaxUint256 }
                    )

      const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                            Buffer.from(privateKeyRegister.slice(2), 'hex'))           
      const signature: SignatureStruct = { v, r, s, token: AKREToken.address, value:minerPrice, deadline: constants.MaxUint256 } 

      const signature_err: SignatureStruct = { ...signature, s: r } 
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardNative(receiver, miners[1], signature_err, {value: minerPrice}))          
              .to.be.revertedWith("Arkreen Miner: INVALID_SIGNATURE")

      const balanceArkreenMiner = await ethers.provider.getBalance(ArkreenMiner.address)

      const balanceMatic = await ethers.provider.getBalance(owner1.address)
      await expect(ArkreenMiner.connect(owner1).RemoteMinerOnboardNative(receiver,  miners[1], signature, {value: minerPrice}))
              .to.emit(AKREToken, "Transfer")
              .withArgs(owner1.address, ArkreenMiner.address, minerPrice)
              .to.emit(ArkreenMiner, "MinerOnboarded")
              .withArgs(receiver, miners[1]);

      expect(await ethers.provider.getBalance(owner1.address)).to.lt(balanceMatic.sub(minerPrice));
      expect(await ethers.provider.getBalance(ArkreenMiner.address)).to.equal(balanceArkreenMiner.add(minerPrice));
      expect(await ArkreenMiner.totalSupply()).to.equal(1);
      expect(await ArkreenMiner.balanceOf(receiver)).to.equal(1);

      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp
      const minerInfo = [miners[1], MinerType.RemoteMiner, MinerStatus.Normal, timestamp]
      const minerNFT = await ArkreenMiner.tokenOfOwnerByIndex(receiver, 0)
      expect(await ArkreenMiner.AllMinerInfo(minerNFT)).to.deep.eq(minerInfo);
      expect(await ArkreenMiner.AllMinersToken(miners[1])).to.deep.eq(minerNFT);
      expect(await ArkreenMiner.whiteListMiner(miners[1])).to.deep.eq(0);
    })
  })

  describe("ArkreenMiner: Virtual miner onboarding in batch", () => {
    it("ArkreenMiner Virtual Miner Batch Onboarding: Basic check", async () => {
      const owners_0 = randomAddresses(5)
      const miners_0 = randomAddresses(3)
      await ArkreenMiner.setManager(Miner_Manager, manager.address)
      // only manager accepted
      await expect(ArkreenMiner.connect(deployer).RemoteMinerOnboardInBatch(owners_0, miners_0))
              .to.be.revertedWith("Arkreen Miner: Not Miner Manager")    
      // list length not match
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardInBatch(owners_0, miners_0))
              .to.be.revertedWith("Arkreen Miner: Wrong Address List")
      // Normal case 
      const owners = randomAddresses(5)
      const miners = randomAddresses(5)
      await ArkreenMiner.setManager(Miner_Manager, manager.address)
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardInBatch(owners, miners))
            .to.emit(ArkreenMiner, "VitualMinersInBatch")
            .withArgs(owners, miners);
      const lastBlock = await ethers.provider.getBlock('latest')
      const timestamp = lastBlock.timestamp
      const minerInfo_0 = [miners[0], MinerType.RemoteMiner, MinerStatus.Normal, timestamp]
      const minerInfo_1 = [miners[1], MinerType.RemoteMiner, MinerStatus.Normal, timestamp]
      const minerInfo_2 = [miners[2], MinerType.RemoteMiner, MinerStatus.Normal, timestamp]
      const minerNFT_0 = await ArkreenMiner.tokenOfOwnerByIndex(owners[0], 0)
      const minerNFT_1 = await ArkreenMiner.tokenOfOwnerByIndex(owners[1], 0)
      const minerNFT_2 = await ArkreenMiner.tokenOfOwnerByIndex(owners[2], 0)        
      expect(await ArkreenMiner.AllMinerInfo(minerNFT_0)).to.deep.eq(minerInfo_0);
      expect(await ArkreenMiner.AllMinerInfo(minerNFT_1)).to.deep.eq(minerInfo_1); 
      expect(await ArkreenMiner.AllMinerInfo(minerNFT_2)).to.deep.eq(minerInfo_2); 
      // Forbidden after formal launch
      await ArkreenMiner.setLaunchTime(FORMAL_LAUNCH)
      await time.increaseTo(FORMAL_LAUNCH + 1)
      await expect(ArkreenMiner.connect(manager).RemoteMinerOnboardInBatch(owners, miners))
              .to.be.revertedWith("Arkreen Miner: Gaming Phase Ended")
    })
  })
  describe("ArkreenMiner: Upgrading test", () => {
    async function deployArkreenMinerFixture() {
      const ArkreenMinerFactoryV10U = await ethers.getContractFactory("ArkreenMinerV10U");
      const ArkreenMinerV10U = await upgrades.upgradeProxy(ArkreenMiner.address, ArkreenMinerFactoryV10U)
      await ArkreenMinerV10U.deployed()    
      return { ArkreenMinerV10U }
    }
    it("ArkreenMiner Upgrading: Basic check", async () => {
      const { ArkreenMinerV10U } = await loadFixture(deployArkreenMinerFixture);
      expect(await ArkreenMinerV10U.version()).to.equal('1.0.1');
      const receivers = randomAddresses(10)
      const miners = randomAddresses(10)
      await ArkreenMinerV10U.connect(manager).RemoteMinerOnboardInBatch(receivers, miners)
      expect(await ArkreenMinerV10U.tokenURI(9)).to.equal('https://www.arkreen.com/miners/9');
      await ArkreenMinerV10U.connect(deployer).updateMineMore(9, "Miner 9 more testing info")
      expect(await ArkreenMinerV10U.getMineMore(9)).to.equal('Miner 9 more testing info');
    })
  })
});
