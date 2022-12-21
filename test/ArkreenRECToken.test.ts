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
import { getApprovalDigest, expandTo18Decimals, randomAddresses, MinerType, RECStatus } from "./utils/utilities";
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { RECRequestStruct, SignatureStruct, RECDataStruct } from "../typechain/contracts/ArkreenRECIssuance";

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

      const ArkreenMinerFactory = await ethers.getContractFactory("ArkreenMiner")
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

      // set formal launch
      const lastBlock = await ethers.provider.getBlock('latest')
      await arkreenMiner.setLaunchTime(lastBlock.timestamp+5)
      await time.increaseTo(lastBlock.timestamp+5)

      const payer = maker1.address
      const nonce = await AKREToken.nonces(payer)
      const gameMiner =  constants.AddressZero
      const feeRegister = expandTo18Decimals(200)

      const digest = await getApprovalDigest(
        AKREToken,
        { owner: payer, spender: arkreenMiner.address, value: feeRegister },
        nonce,
        constants.MaxUint256
      )

      const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyMaker.slice(2), 'hex'))
      const signature = { v, r, s, token: AKREToken.address, value:feeRegister, deadline: constants.MaxUint256 }    
 
      await arkreenMiner.setManager(Miner_Manager, manager.address)
      await arkreenMiner.ManageManufactures([payer], true)     

      let DTUMiner = randomAddresses(1)[0]
      await arkreenMiner.connect(manager).MinerOnboard(
                owner1.address, DTUMiner, gameMiner, MinerType.StandardMiner, payer, signature)

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

    it("ArkreenRECToken: commitOffset", async () => {
       // commitOffset
      const balance_1 = await arkreenRECToken.balanceOf(owner1.address)
      const totalSupply = await arkreenRECToken.totalSupply()
      await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
      expect(await arkreenRECToken.balanceOf(owner1.address)).to.equal(balance_1.sub(expandTo18Decimals(10)))
      expect(await arkreenRECToken.totalSupply()).to.equal(totalSupply.sub(expandTo18Decimals(10)))
      const offsetID1 = await arkreenRetirement.offsetCounter()

      await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
      expect(await arkreenRECToken.balanceOf(owner1.address)).to.equal(balance_1.sub(expandTo18Decimals(20)))
      const offsetID2 = await arkreenRetirement.offsetCounter()

      await expect(arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10)))
              .to.emit(arkreenRECToken, "OffsetFinished")
              .withArgs(owner1.address, expandTo18Decimals(10), offsetID2.add(1)) 
      
      expect(await arkreenRECToken.totalOffset()).to.equal(expandTo18Decimals(30))
      await arkreenRetirement.connect(owner1).mintCertificate(
                              owner1.address, owner1.address, "Owner","","Save Earcth",[offsetID1,offsetID2])
            
    })

    it("ArkreenRECToken: commitOffsetFrom", async () => {

      // commitOffsetFrom
      await arkreenRECToken.connect(owner1).approve(owner2.address, expandTo18Decimals(1000))
      const balance_1 = await arkreenRECToken.balanceOf(owner1.address)
      const allowance_1 = await arkreenRECToken.allowance(owner1.address, owner2.address)
      const totalSupply = await arkreenRECToken.totalSupply()

      await arkreenRECToken.connect(owner2).commitOffsetFrom(owner1.address, expandTo18Decimals(10))

      expect(await arkreenRECToken.balanceOf(owner1.address)).to.equal(balance_1.sub(expandTo18Decimals(10)))
      expect(await arkreenRECToken.allowance(owner1.address, owner2.address)).to.equal(allowance_1.sub(expandTo18Decimals(10)))
      expect(await arkreenRECToken.totalSupply()).to.equal(totalSupply.sub(expandTo18Decimals(10)))
      const offsetID1 = await arkreenRetirement.offsetCounter()

      await arkreenRECToken.connect(owner2).commitOffsetFrom(owner1.address, expandTo18Decimals(10))
      expect(await arkreenRECToken.balanceOf(owner1.address)).to.equal(balance_1.sub(expandTo18Decimals(20)))
      const offsetID2 = await arkreenRetirement.offsetCounter()

      await expect(arkreenRECToken.connect(owner2).commitOffsetFrom(owner1.address, expandTo18Decimals(10)))
              .to.emit(arkreenRECToken, "OffsetFinished")
             .withArgs(owner1.address, expandTo18Decimals(10), offsetID2.add(1))

      expect(await arkreenRECToken.totalOffset()).to.equal(expandTo18Decimals(30))        
      const offsetID3 = await arkreenRetirement.offsetCounter()              
     
      await arkreenRetirement.connect(owner1).mintCertificate(
                             owner1.address, owner1.address, "Owner","","Save Earcth",[offsetID1, offsetID2, offsetID3])
           
   })

    it("ArkreenRECToken: mintCertificate: By REC token", async () => {
      // offsetAndMintCertificate
      await arkreenRECToken.connect(owner1).offsetAndMintCertificate(
                                              owner1.address, "Owner","Alice","Save Earcth",expandTo18Decimals(10)) 

       // commitOffset
      await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
      const offsetID1 = await arkreenRetirement.offsetCounter()

      await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
      const offsetID2 = await arkreenRetirement.offsetCounter()
      
      await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
      const offsetID3 = await arkreenRetirement.offsetCounter()

      // mintCertificate
      await arkreenRetirement.connect(owner1).mintCertificate(owner1.address, owner1.address, "Owner","","Save Earcth",[offsetID1,offsetID2]) 
      const certId = await arkreenRetirement.totalSupply()
      const lastBlock = await ethers.provider.getBlock('latest')

      // attachOffsetEvents
      await arkreenRetirement.connect(owner1).attachOffsetEvents(certId, [offsetID3])
      
      // updateCertificate
      await arkreenRetirement.connect(owner1).updateCertificate(certId, owner1.address, "Kitty","Alice","")

      const offsetRecord = [owner1.address, owner1.address, "Kitty", "Alice", "Save Earcth", 
                            BigNumber.from(lastBlock.timestamp), expandTo18Decimals(30), [offsetID1,offsetID2,offsetID3]]
      expect(await arkreenRetirement.getCertificate(certId)).to.deep.equal(offsetRecord)

      // attachOffsetEvents
      await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
      const offsetID4 = await arkreenRetirement.offsetCounter()
      await arkreenRetirement.connect(owner1).attachOffsetEvents(certId, [offsetID4])        

  });

  describe("liquidizeREC", () => {
    let tokenID: BigNumber

    beforeEach(async () => {
      const startTime = 1564888526
      const endTime   = 1654888526
      
      let recMintRequest: RECRequestStruct = { 
        issuer: manager.address, startTime, endTime,
        amountREC: expandTo18Decimals(1000), 
        cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte",
        region: 'Beijing',
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
//    await arkreenRECIssuance.managePaymentToken(AKREToken.address, true)
      const price0:BigNumber = expandTo18Decimals(50)
      await arkreenRECIssuance.updateARECMintPrice(AKREToken.address, price0)

      await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
      tokenID = await arkreenRECIssuance.totalSupply()

      await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")

    })

    it("ArkreenRECIssuance: liquidizeREC", async () => {
      const total_init = await arkreenRECToken.totalLiquidized()
      await arkreenRECIssuance.connect(owner1).liquidizeREC(tokenID)
      expect(await arkreenRECToken.totalLiquidized()).to.equal(total_init.add(expandTo18Decimals(1000)));

    });

    it("ArkreenRECIssuance: liquidizeREC (Liquidation no fee)", async () => {
      await expect(arkreenRECToken.setRatioFee(20000))
            .to.be.revertedWith("ART: Wrong Data")

      await expect(arkreenRECToken.connect(owner1).setRatioFee(1000))
            .to.be.revertedWith("Ownable: caller is not the owner")

      await arkreenRECToken.setRatioFee(1000)
       const total_init = await arkreenRECToken.totalLiquidized()
      await arkreenRECIssuance.connect(owner1).liquidizeREC(tokenID)
      expect(await arkreenRECToken.totalLiquidized()).to.equal(total_init.add(expandTo18Decimals(1000)));

    });

    it("ArkreenRECIssuance: liquidizeREC (Liquidation fee)", async () => {
      await expect(arkreenRECToken.setReceiverFee(constants.AddressZero))
            .to.be.revertedWith("ART: Wrong Address")

      await expect(arkreenRECToken.connect(owner1).setReceiverFee(owner2.address))
            .to.be.revertedWith("Ownable: caller is not the owner")

      await arkreenRECToken.setReceiverFee(owner2.address)
      await arkreenRECToken.setRatioFee(1000)
      const total_init = await arkreenRECToken.totalLiquidized()
      await arkreenRECIssuance.connect(owner1).liquidizeREC(tokenID)
      expect(await arkreenRECToken.totalLiquidized()).to.equal(total_init.add(expandTo18Decimals(1000)));

      expect(await arkreenRECToken.balanceOf(owner1.address))
              .to.equal(expandTo18Decimals(1000).mul(9).div(10).add(total_init));
      expect(await arkreenRECToken.balanceOf(owner2.address)).to.equal(expandTo18Decimals(1000).div(10));

    });    
  })
});
