import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { constants, BigNumber, Contract } from 'ethers'
import { ethers, network, upgrades } from "hardhat";

import {
    ArkreenTokenTest,
    ArkreenMiner,
    ArkreenRECIssuance,
    ArkreenRegistry,
    ArkreenRECToken,
    ArkreenBadge,
} from "../typechain";


import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { getApprovalDigest, expandTo18Decimals, randomAddresses, RECStatus, MinerType } from "./utils/utilities";
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { RECRequestStruct, SignatureStruct, RECDataStruct } from "../typechain/contracts/ArkreenRECIssuance";
import { OffsetActionStruct }  from "../typechain/contracts/ArkreenBadge";

const MASK_OFFSET = BigNumber.from('0x8000000000000000')
const MASK_DETAILS = BigNumber.from('0xC000000000000000')

describe("ArkreenRECToken", () => {
    let deployer: SignerWithAddress;
    let manager: SignerWithAddress;
    let register_authority: SignerWithAddress;
    let fund_receiver: SignerWithAddress;

    let owner1: SignerWithAddress;
    let owner2: SignerWithAddress;
    let miner1: SignerWithAddress;
    let miner2: SignerWithAddress;
    let maker1: SignerWithAddress;
    let maker2: SignerWithAddress;

    let privateKeyManager:      string
    let privateKeyRegister:     string
    let privateKeyOwner:        string
    let privateKeyMaker:        string

    let AKREToken:                    ArkreenTokenTest
    let arkreenMiner:                 ArkreenMiner
    let arkreenRegistry:             ArkreenRegistry
    let arkreenRECIssuance:           ArkreenRECIssuance
    let arkreenRECToken:              ArkreenRECToken
    let arkreenRetirement:            ArkreenBadge

    const Miner_Manager       = 0         

    async function deployFixture() {
      const AKRETokenFactory = await ethers.getContractFactory("ArkreenTokenTest");
      const AKREToken = await AKRETokenFactory.deploy(10_000_000_000);
      await AKREToken.deployed();

      const ArkreenMinerFactory = await ethers.getContractFactory("ArkreenMinerV10")
      const arkreenMiner = await upgrades.deployProxy(ArkreenMinerFactory,
                                        [AKREToken.address, manager.address, register_authority.address]) as ArkreenMiner
      await arkreenMiner.deployed()
 
      const ArkreenRegistryFactory = await ethers.getContractFactory("ArkreenRegistry")
      const arkreenRegistry = await upgrades.deployProxy(ArkreenRegistryFactory,[]) as ArkreenRegistry
      await arkreenRegistry.deployed()

      const ArkreenRECIssuanceFactory = await ethers.getContractFactory("ArkreenRECIssuance")
      const arkreenRECIssuance = await upgrades.deployProxy(ArkreenRECIssuanceFactory, 
                                  [AKREToken.address, arkreenRegistry.address]) as ArkreenRECIssuance
      await arkreenRECIssuance.deployed()

      const ArkreenRECTokenFactory = await ethers.getContractFactory("ArkreenRECToken")
      arkreenRECToken = await upgrades.deployProxy(ArkreenRECTokenFactory,[arkreenRegistry.address, manager.address]) as ArkreenRECToken
      await arkreenRECToken.deployed()
      
      const ArkreenRetirementFactory = await ethers.getContractFactory("ArkreenBadge")
      arkreenRetirement = await upgrades.deployProxy(ArkreenRetirementFactory,[arkreenRegistry.address]) as ArkreenBadge
      await arkreenRetirement.deployed()           
  
      await AKREToken.transfer(owner1.address, expandTo18Decimals(10000))
      await AKREToken.connect(owner1).approve(arkreenRECIssuance.address, expandTo18Decimals(10000))
      await AKREToken.transfer(maker1.address, expandTo18Decimals(10000))
      await AKREToken.connect(maker1).approve(arkreenRECIssuance.address, expandTo18Decimals(10000))
      await AKREToken.connect(owner1).approve(arkreenMiner.address, expandTo18Decimals(10000))
      await AKREToken.connect(maker1).approve(arkreenMiner.address, expandTo18Decimals(10000))

      const miners = randomAddresses(2)
      await arkreenMiner.connect(manager).VirtualMinerOnboardInBatch([owner1.address, maker1.address], miners)

      // set formal launch
      const lastBlock = await ethers.provider.getBlock('latest')
      await arkreenMiner.setLaunchTime(lastBlock.timestamp+5)
      await time.increaseTo(lastBlock.timestamp+5)

      const payer = maker1.address
      await arkreenMiner.setManager(Miner_Manager, manager.address)
      await arkreenMiner.ManageManufactures([payer], true)     

      await arkreenRegistry.addRECIssuer(manager.address, arkreenRECToken.address, "Arkreen Issuer")
      await arkreenRegistry.setRECIssuance(arkreenRECIssuance.address)
      await arkreenRegistry.setArkreenRetirement(arkreenRetirement.address)

      return {AKREToken, arkreenMiner, arkreenRegistry, arkreenRECIssuance, arkreenRECToken, arkreenRetirement}
    }

    beforeEach(async () => {
        [deployer, manager, register_authority, fund_receiver, owner1, owner2, miner1, miner2, maker1, maker2] = await ethers.getSigners();

        privateKeyManager = process.env.MANAGER_TEST_PRIVATE_KEY as string
        privateKeyRegister = process.env.REGISTER_TEST_PRIVATE_KEY as string
        privateKeyOwner = process.env.OWNER_TEST_PRIVATE_KEY as string
        privateKeyMaker = process.env.MAKER_TEST_PRIVATE_KEY as string
    
        const fixture = await loadFixture(deployFixture)
        AKREToken = fixture.AKREToken
        arkreenMiner = fixture.arkreenMiner        
        arkreenRegistry = fixture.arkreenRegistry
        arkreenRECIssuance = fixture.arkreenRECIssuance
        arkreenRetirement = fixture.arkreenRetirement

        const startTime = 1564888526
        const endTime   = 1654888526

        let recMintRequest: RECRequestStruct = { 
          issuer: manager.address, region: 'Beijing', startTime, endTime,
          amountREC: expandTo18Decimals(1000), 
          cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte", 
          url:"", memo:""
        } 
  
        const mintFee = expandTo18Decimals(100)
        const nonce1 = await AKREToken.nonces(owner1.address)
        const digest1 = await getApprovalDigest(
                                AKREToken,
                                { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                nonce1,
                                constants.MaxUint256
                              )
        const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
        const signature: SignatureStruct = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 
        
        // Mint
        await arkreenRegistry.setArkreenMiner(arkreenMiner.address)
//      await arkreenRECIssuance.managePaymentToken(AKREToken.address, true)
        const price0:BigNumber = expandTo18Decimals(50)
        await arkreenRECIssuance.updateARECMintPrice(AKREToken.address, price0)
        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
  
        const tokenID = await arkreenRECIssuance.totalSupply()
        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")
        await arkreenRECIssuance.connect(owner1).liquidizeREC(tokenID)

    });

    it("ArkreenRECToken: Basics", async () => {
        expect(await arkreenRECToken.NAME()).to.equal("Arkreen REC Token");
        expect(await arkreenRECToken.SYMBOL()).to.equal("ART");
    });

    it("ArkreenRECToken: commitOffset basics", async () => {

      async function mintARECMaker(amountREC: number) {
        const startTime = 1564888526
        const endTime   = 1654888526
        
        let recMintRequest: RECRequestStruct = { 
          issuer: manager.address, startTime, endTime,
          amountREC: expandTo18Decimals(amountREC), 
          cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte",
          region: 'Beijing',
          url:"", memo:""
        } 
  
        const mintFee = expandTo18Decimals(100)
        const nonce1 = await AKREToken.nonces(maker1.address)
        const digest1 = await getApprovalDigest(
                                AKREToken,
                                { owner: maker1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                nonce1,
                                constants.MaxUint256
                              )
        const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyMaker.slice(2), 'hex'))
        const signature: SignatureStruct = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 
        
        await arkreenRECIssuance.connect(maker1).mintRECRequest(recMintRequest, signature)
        const tokenID = await arkreenRECIssuance.totalSupply()
  
        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")
        await arkreenRECIssuance.connect(maker1).liquidizeREC(tokenID)
      }
  
      // commitOffset
      await mintARECMaker(5000)       
      await expect(arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(0)))
              .to.be.revertedWith("ART: Zero Offset")

      await expect(arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(2000)))
              .to.be.revertedWith("ERC20: burn amount exceeds balance")

      let lastBlock
      const tokenID = BigNumber.from(1)
      const balance_1 = await arkreenRECToken.balanceOf(owner1.address)
      const totalSupply = await arkreenRECToken.totalSupply()
      await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
      expect(await arkreenRECToken.balanceOf(owner1.address)).to.equal(balance_1.sub(expandTo18Decimals(10)))
      expect(await arkreenRECToken.totalSupply()).to.equal(totalSupply.sub(expandTo18Decimals(10)))
      const offsetID1 = await arkreenRetirement.offsetCounter()
      lastBlock = await ethers.provider.getBlock('latest')
      const action_1 = [  owner1.address, manager.address, expandTo18Decimals(10),    // Manger is the issuer address
                          tokenID.add(MASK_OFFSET), lastBlock.timestamp, false ]

      expect(await arkreenRetirement.getOffsetActions(offsetID1)).to.deep.equal(action_1)

      expect(await arkreenRetirement.partialARECID()).to.equal(1)
      expect(await arkreenRetirement.partialAvailableAmount()).to.equal(balance_1.sub(expandTo18Decimals(10)))
      
      await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
      expect(await arkreenRECToken.balanceOf(owner1.address)).to.equal(balance_1.sub(expandTo18Decimals(20)))
      const offsetID2 = await arkreenRetirement.offsetCounter()
      lastBlock = await ethers.provider.getBlock('latest')
      const action_2 = [  owner1.address, manager.address, expandTo18Decimals(10),
                          tokenID.add(MASK_OFFSET), lastBlock.timestamp, false ]

      expect(await arkreenRetirement.partialARECID()).to.equal(1)
      expect(await arkreenRetirement.partialAvailableAmount()).to.equal(balance_1.sub(expandTo18Decimals(20)))                          

      expect(await arkreenRetirement.getOffsetActions(offsetID2)).to.deep.equal(action_2)

      await expect(arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10)))
              .to.emit(arkreenRECToken, "OffsetFinished")
              .withArgs(owner1.address, expandTo18Decimals(10), offsetID2.add(1)) 

      expect(await arkreenRetirement.partialARECID()).to.equal(1)
      expect(await arkreenRetirement.partialAvailableAmount()).to.equal(balance_1.sub(expandTo18Decimals(30)))     
      
      const recData: RECDataStruct = await arkreenRECIssuance.getRECData(tokenID)
      expect(recData.status).to.equal(BigNumber.from(RECStatus.Retired));      

      expect(await arkreenRECToken.totalOffset()).to.equal(expandTo18Decimals(30))
      await arkreenRetirement.connect(owner1).mintCertificate(
                              owner1.address, owner1.address, "Owner","","Save Earth",[offsetID1,offsetID2])
            
    })

});
