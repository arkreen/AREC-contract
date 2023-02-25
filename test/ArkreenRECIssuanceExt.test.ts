import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { constants, BigNumber, Contract } from 'ethers'
import { ethers, network, upgrades } from "hardhat";
import { ArkreenRECIssuanceExt__factory } from "../typechain";

import {
    ArkreenTokenTest,
    ArkreenMiner,
    ArkreenRECIssuance,
    ArkreenRECIssuanceExt,
    ArkreenRegistry,
    ArkreenRECToken,
    ArkreenBadge
} from "../typechain";

import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { getApprovalDigest, expandTo18Decimals, randomAddresses, MinerType, RECStatus, expandTo9Decimals } from "./utils/utilities";
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { RECRequestStruct, SignatureStruct, RECDataStruct } from "../typechain/contracts/ArkreenRECIssuance";

describe("ArkreenRECIssuanceExt", () => {
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
    let arkreenRegistry:              ArkreenRegistry
    let arkreenRECIssuance:           ArkreenRECIssuance
    let arkreenRECIssuanceExt:        ArkreenRECIssuanceExt


    let arkreenRECToken:              ArkreenRECToken
    let ArkreenRECTokenESG:           ArkreenRECToken
    let arkreenRetirement:            ArkreenBadge

    const FORMAL_LAUNCH       = 1682913600;         // 2023-05-01, 12:00:00
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

      const ArkreenRECIssuanceExtFactory = await ethers.getContractFactory("ArkreenRECIssuanceExt")
      const arkreenRECIssuanceExtImp = await ArkreenRECIssuanceExtFactory.deploy()
      await arkreenRECIssuanceExtImp.deployed()    
      
      await arkreenRECIssuance.setESGExtAddress(arkreenRECIssuanceExtImp.address)

      const ArkreenRECTokenFactory = await ethers.getContractFactory("ArkreenRECToken")
      const arkreenRECToken = await upgrades.deployProxy(ArkreenRECTokenFactory,[arkreenRegistry.address, manager.address,'','']) as ArkreenRECToken
      await arkreenRECToken.deployed()   

      const ArkreenRECTokenESGFactory = await ethers.getContractFactory("ArkreenRECToken")
      const ArkreenRECTokenESG = await upgrades.deployProxy(ArkreenRECTokenESGFactory,[arkreenRegistry.address, manager.address,'HashKey AREC Token','HART']) as ArkreenRECToken
      await ArkreenRECTokenESG.deployed()          
      
      const ArkreenRetirementFactory = await ethers.getContractFactory("ArkreenBadge")
      const arkreenRetirement = await upgrades.deployProxy(ArkreenRetirementFactory,[arkreenRegistry.address]) as ArkreenBadge
      await arkreenRetirement.deployed()           
  
      await AKREToken.transfer(owner1.address, expandTo18Decimals(100000))
      await AKREToken.connect(owner1).approve(arkreenRECIssuance.address, expandTo18Decimals(100000))
      await AKREToken.transfer(maker1.address, expandTo18Decimals(100000))
      await AKREToken.connect(maker1).approve(arkreenRECIssuance.address, expandTo18Decimals(100000))
      await AKREToken.connect(owner1).approve(arkreenMiner.address, expandTo18Decimals(100000))
      await AKREToken.connect(maker1).approve(arkreenMiner.address, expandTo18Decimals(100000))

      // set formal launch
      await arkreenMiner.setLaunchTime(FORMAL_LAUNCH)
      await time.increaseTo(FORMAL_LAUNCH + 1)

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

      arkreenRECIssuanceExt = ArkreenRECIssuanceExt__factory.connect(arkreenRECIssuance.address, deployer);

      await arkreenRegistry.newAssetAREC('Test ARE', maker1.address, arkreenRECToken.address,
                  AKREToken.address, BigNumber.from("0x3635c9adc5dea00000"), 1000, 'HashKey ESG BTC' )

      return {AKREToken, arkreenMiner, arkreenRegistry, arkreenRECIssuance, arkreenRECToken, ArkreenRECTokenESG, arkreenRetirement, arkreenRECIssuanceExt}
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
        arkreenRECIssuanceExt = fixture.arkreenRECIssuanceExt
        arkreenRECToken = fixture.arkreenRECToken
    });

    describe("mintESGBatch", () => {
      let signature: SignatureStruct
      let recMintRequest: RECRequestStruct 
      let lastBlock
      const startTime = 1564888526
      const endTime   = 1654888526
      const mintFee = expandTo18Decimals(99 *1000)      

      beforeEach(async () => {
        recMintRequest = { 
          issuer: manager.address, startTime, endTime,
          amountREC: BigNumber.from(1000), 
          cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte", 
          region: 'Beijing',
          url:"", memo:""
        } 
        const nonce1 = await AKREToken.nonces(owner1.address)
        const digest1 = await getApprovalDigest(
                                AKREToken,
                                { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                nonce1,
                                constants.MaxUint256
                              )
        const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
        signature = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 
      })

      it("ArkreenRECIssuanceExt: mintESGBatch Abnormal", async () => {

        lastBlock = await ethers.provider.getBlock('latest') 
        signature.deadline = BigNumber.from(lastBlock.timestamp -1 )

        // Deadline check
        recMintRequest.issuer = maker1.address
        await expect(arkreenRECIssuanceExt.connect(owner1).mintESGBatch(1, expandTo9Decimals(99), signature))
                .to.be.revertedWith("RECIssuance: EXPIRED") 

        // Only MVP entity allowed
        signature.deadline = constants.MaxUint256
        await expect(arkreenRECIssuanceExt.connect(owner1).mintESGBatch(1, expandTo9Decimals(99), signature))
                .to.be.revertedWith("AREC: Not Allowed") 
        recMintRequest.issuer = manager.address    

        await arkreenRECIssuanceExt.manageMVPAddress(true,[owner1.address])

        signature.token = arkreenRECToken.address
        await expect(arkreenRECIssuanceExt.connect(owner1).mintESGBatch(1, expandTo9Decimals(99), signature))
                .to.be.revertedWith("AREC: Wrong Payment Token") 

        // Miner Contract not set
        signature.token = AKREToken.address
        signature.value = mintFee.sub(1)
        await expect(arkreenRECIssuanceExt.connect(owner1).mintESGBatch(1, expandTo9Decimals(99), signature))
                .to.be.revertedWith("AREC: Low Payment Value") 

        signature.value = mintFee
        signature.deadline = constants.MaxUint256.sub(1)
        await expect(arkreenRECIssuanceExt.connect(owner1).mintESGBatch(1, expandTo9Decimals(99), signature))
                .to.be.revertedWith("ERC20Permit: invalid signature")    

        signature.deadline = constants.MaxUint256
        await arkreenRECIssuanceExt.connect(owner1).mintESGBatch(1, expandTo9Decimals(99), signature)

      });

      it("ArkreenRECIssuanceExt: mintESGBatch Normal", async () => {
        // Normal
        await arkreenRECIssuanceExt.manageMVPAddress(true,[owner1.address])              
        const balanceArkreenRECIssuance = await AKREToken.balanceOf(arkreenRECIssuance.address)
        await expect(arkreenRECIssuanceExt.connect(owner1).mintESGBatch(1, expandTo9Decimals(99), signature))
                  .to.emit(arkreenRECIssuanceExt, 'Transfer')
                  .withArgs(0, owner1.address, 1)
                  .to.emit(arkreenRECIssuanceExt, 'ESGBatchMinted')
                  .withArgs(owner1.address, 1)
                  .to.emit(AKREToken, 'Transfer')
                  .withArgs(owner1.address, arkreenRECIssuanceExt.address, mintFee)

        let recData = [ maker1.address,  "",  owner1.address,
                        0,  0,
                        expandTo9Decimals(99),
                        BigNumber.from(RECStatus.Pending),
                        '', 
                        '',
                        '', '', 1 ]

        expect(await arkreenRECIssuance.getRECData(1)).to.deep.eq(recData);

        let payInfo = [AKREToken.address, mintFee]
        expect(await arkreenRECIssuance.allPayInfo(1)).to.deep.eq(payInfo);
        
        expect(await AKREToken.balanceOf(arkreenRECIssuance.address)).to.equal(balanceArkreenRECIssuance.add(mintFee))
      })
    })

    describe("updateRECDataExt", () => {
      let tokenID: BigNumber
      let signature: SignatureStruct
      const startTime = 1564888526
      const endTime   = 1654888526
      const mintFee = expandTo18Decimals(9 *1000)   

      const region = "Shanghai"
      const url = "https://www.arkreen.com/AREC/"
      const memo = "Test Update"   
      const cID = "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte"

      beforeEach(async () => {
        const nonce1 = await AKREToken.nonces(owner1.address)
        const digest1 = await getApprovalDigest(
                                AKREToken,
                                { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                nonce1,
                                constants.MaxUint256
                              )
        const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
        signature = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 

        // Normal
        await arkreenRECIssuanceExt.manageMVPAddress(true,[owner1.address])    
        await arkreenRECIssuanceExt.connect(owner1).mintESGBatch(1, expandTo9Decimals(9), signature)
        tokenID = await arkreenRECIssuanceExt.totalSupply()
      })

      it("ArkreenRECIssuanceExt: updateRECDataExt Abnormal", async () => {

        await expect(arkreenRECIssuanceExt.connect(owner2).updateRECDataExt(tokenID, startTime, endTime, cID, region, url, memo))
                .to.be.revertedWith("AREC: Not Allowed")         

        await arkreenRECIssuanceExt.manageMVPAddress(true,[owner2.address])    
        await expect(arkreenRECIssuanceExt.connect(owner2).updateRECDataExt(tokenID, startTime, endTime, cID, region, url, memo))
                .to.be.revertedWith("AREC: Not Owner") 
                
        await arkreenRECIssuance.connect(maker1).rejectRECRequest(tokenID)  
        await arkreenRECIssuanceExt.connect(owner1).cancelRECRequest(tokenID)
        await expect(arkreenRECIssuanceExt.connect(owner1).updateRECDataExt(tokenID, startTime, endTime, cID, region, url, memo))
                .to.be.revertedWith("AREC: Wrong Status") 
      })

      it("ArkreenRECIssuanceExt: updateRECDataExt Normal", async () => {
        await arkreenRECIssuance.connect(maker1).rejectRECRequest(tokenID)  
        await arkreenRECIssuanceExt.connect(owner1).updateRECDataExt(tokenID, startTime, endTime, cID, region, url, memo)

        await expect(arkreenRECIssuanceExt.connect(owner1).updateRECDataExt(tokenID, startTime, endTime, cID, region, url, memo))
                .to.emit(arkreenRECIssuanceExt, "ESGBatchDataUpdated")
                .withArgs(owner1.address, tokenID)                

        let recData = [ maker1.address,  "",  owner1.address,
                        startTime,  endTime,
                        expandTo9Decimals(9),
                        BigNumber.from(RECStatus.Pending),
                        cID, region, url, memo, 1 ]

        expect(await arkreenRECIssuance.getRECData(tokenID)).to.deep.eq(recData);    
        
        await arkreenRECIssuance.connect(maker1).rejectRECRequest(tokenID)  
        let recData1 = [ maker1.address,  "",  owner1.address,
                        startTime,  endTime,
                        expandTo9Decimals(9),
                        BigNumber.from(RECStatus.Rejected),
                        cID, region, url, memo, 1 ]
        expect(await arkreenRECIssuance.getRECData(tokenID)).to.deep.eq(recData1);  

        const newMemo = 'Test Memo'
        await arkreenRECIssuanceExt.connect(owner1).updateRECDataExt(tokenID, 0, 0, '', '', '', newMemo)
        let recData2 = [ maker1.address,  "",  owner1.address,
                        startTime,  endTime,
                        expandTo9Decimals(9),
                        BigNumber.from(RECStatus.Pending),
                        cID, region, url, newMemo, 1 ]
        expect(await arkreenRECIssuance.getRECData(tokenID)).to.deep.eq(recData2);  
      })
    })



//////////////////////////////////////////////////

    describe("mintRECRequest", () => {
      let signature: SignatureStruct
      let recMintRequest: RECRequestStruct 
      const startTime = 1564888526
      const endTime   = 1654888526
      const mintFee = expandTo18Decimals(100)      

      beforeEach(async () => {
        recMintRequest = { 
          issuer: manager.address, startTime, endTime,
          amountREC: BigNumber.from(1000), 
          cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte", 
          region: 'Beijing',
          url:"", memo:""
        } 
        const nonce1 = await AKREToken.nonces(owner1.address)
        const digest1 = await getApprovalDigest(
                                AKREToken,
                                { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                nonce1,
                                constants.MaxUint256
                              )
        const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
        signature = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 
      })

      it("ArkreenRECIssuanceExt: mintRECRequest Abnormal", async () => {
        // Wrong Issuer
        recMintRequest.issuer = maker1.address
        await expect(arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature))
                .to.be.revertedWith("AREC: Wrong Issuer") 
        recMintRequest.issuer = manager.address    

        recMintRequest.startTime = 1654888526 + 10
        await expect(arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature))
                .to.be.revertedWith("AREC: Wrong Period") 
        recMintRequest.startTime = 1564888526        

        // Miner Contract not set
        await expect(arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature))
                .to.be.revertedWith("Arkreen: Zero Miner Address") 
        await arkreenRegistry.setArkreenMiner(arkreenMiner.address)

        // Not Miner
        /////////////////////////////////////////////////////////
        //        await expect(arkreenRECIssuance.connect(owner2).mintRECRequest(recMintRequest, signature))
        //                .to.be.revertedWith("AREC: Not Miner")                 
        /////////////////////////////////////////////////////////

        // Payment token not set  
        signature.token = maker1.address              
        await expect(arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature))
                .to.be.revertedWith("AREC: Wrong Payment Token") 
        signature.token = AKREToken.address  

        signature.value = expandTo18Decimals(50)
        await expect(arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature))
                .to.be.revertedWith("ERC20Permit: invalid signature") 
        signature.value = expandTo18Decimals(100)

        // Deadline expired
        const lastBlock = await ethers.provider.getBlock('latest')
        signature.deadline = BigNumber.from(lastBlock.timestamp + 600)

        await network.provider.send("evm_increaseTime", [601]);
        await expect(arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature))
                .to.be.revertedWith("RECIssuance: EXPIRED") 
      });

      it("ArkreenRECIssuanceExt: mintRECRequest Normal", async () => {
        // Normal
        await arkreenRegistry.setArkreenMiner(arkreenMiner.address)        
        const balanceArkreenRECIssuance = await AKREToken.balanceOf(arkreenRECIssuance.address)
        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)

        let recData = [ manager.address,  "",  owner1.address,
                        startTime,  endTime,
                        BigNumber.from(1000), 
                        BigNumber.from(RECStatus.Pending),
                        "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte", 
                        'Beijing',
                        "", "", 0 ]

        expect(await arkreenRECIssuance.getRECData(1)).to.deep.eq(recData);

        let payInfo = [AKREToken.address, mintFee]
        expect(await arkreenRECIssuance.allPayInfo(1)).to.deep.eq(payInfo);
        
        expect(await AKREToken.balanceOf(arkreenRECIssuance.address)).to.equal(balanceArkreenRECIssuance.add(mintFee))
      })
    })

    describe("rejectRECRequest", () => {
      let tokenID: BigNumber
      let signature: SignatureStruct
      let recMintRequest: RECRequestStruct 
      const startTime = 1564888526
      const endTime   = 1654888526
      const mintFee = expandTo18Decimals(100)      

      beforeEach(async () => {
        recMintRequest = { 
          issuer: manager.address, startTime, endTime,
          amountREC: BigNumber.from(1000), 
          cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte", 
          region: 'Beijing',
          url:"", memo:""
        } 
        const nonce1 = await AKREToken.nonces(owner1.address)
        const digest1 = await getApprovalDigest(
                                AKREToken,
                                { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                nonce1,
                                constants.MaxUint256
                              )
        const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
        signature = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 

        // Normal
        await arkreenRegistry.setArkreenMiner(arkreenMiner.address)        
        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
        tokenID = await arkreenRECIssuance.totalSupply()
      })

      it("ArkreenRECIssuanceExt: rejectRECRequest", async () => {
        // Not issuer
        await expect(arkreenRECIssuance.connect(maker1).rejectRECRequest(tokenID))
                .to.be.revertedWith("AREC: Not Issuer") 

        await arkreenRegistry.addRECIssuer(maker1.address, arkreenRECToken.address, "Arkreen Issuer Maker") 

        await expect(arkreenRECIssuance.connect(maker1).rejectRECRequest(tokenID))
                .to.be.revertedWith("AREC: Wrong Issuer")                       

        await expect(arkreenRECIssuance.connect(manager).rejectRECRequest(tokenID))
                .to.emit(arkreenRECIssuance, "RECRejected")
                .withArgs(tokenID)
        
        const recData: RECDataStruct = await arkreenRECIssuance.getRECData(tokenID)
        expect(recData.status).to.equal(BigNumber.from(RECStatus.Rejected));                      

        await expect(arkreenRECIssuance.connect(manager).rejectRECRequest(tokenID))
                .to.be.revertedWith("AREC: Wrong Status")    
      })
    })

    describe("updateRECData", () => {
      let tokenID: BigNumber
      let signature: SignatureStruct
      let recMintRequest: RECRequestStruct 
      const startTime = 1564888526
      const endTime   = 1654888526
      const mintFee = expandTo18Decimals(100)    

      const region = "Shanghai"
      const url = "https://www.arkreen.com/AREC/"
      const memo = "Test Update"        

      beforeEach(async () => {
        recMintRequest = { 
          issuer: manager.address, startTime, endTime,
          amountREC: BigNumber.from(1000), 
          cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte", 
          region: 'Beijing',
          url:"", memo:""
        } 
        const nonce1 = await AKREToken.nonces(owner1.address)
        const digest1 = await getApprovalDigest(
                                AKREToken,
                                { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                nonce1,
                                constants.MaxUint256
                              )
        const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
        signature = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 

        // Normal
        await arkreenRegistry.setArkreenMiner(arkreenMiner.address)        
        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
        tokenID = await arkreenRECIssuance.totalSupply()
      })

      it("ArkreenRECIssuanceExt: updateRECData Abnormal", async () => {
        await expect(arkreenRECIssuance.connect(owner2).updateRECData(tokenID, maker1.address, region, url, memo ))
                .to.be.revertedWith("AREC: Not Owner") 

        await expect(arkreenRECIssuance.connect(owner1).updateRECData(tokenID, maker1.address, region, url, memo ))
                .to.be.revertedWith("AREC: Wrong Status") 

        await arkreenRECIssuance.connect(manager).rejectRECRequest(tokenID)  
        await expect(arkreenRECIssuance.connect(owner1).updateRECData(tokenID, maker1.address, region, url, memo ))
                .to.be.revertedWith("AREC: Wrong Issuer")           
      })

      it("ArkreenRECIssuanceExt: updateRECData Normal", async () => {
        await arkreenRECIssuance.connect(manager).rejectRECRequest(tokenID)  
        await expect(arkreenRECIssuance.connect(owner1).updateRECData(tokenID, manager.address, region, url, memo))
                .to.emit(arkreenRECIssuance, "RECDataUpdated")
                .withArgs(owner1.address, tokenID)

        let recData = [ manager.address,  "",  owner1.address,
                        startTime,  endTime,
                        BigNumber.from(1000), 
                        BigNumber.from(RECStatus.Pending),
                        "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte", 
                        region, url, memo, 0 ]

        expect(await arkreenRECIssuance.getRECData(tokenID)).to.deep.eq(recData);     
      })
    })

    describe("cancelRECRequest", () => {
      let tokenID: BigNumber
      let signature: SignatureStruct
      let recMintRequest: RECRequestStruct 
      const startTime = 1564888526
      const endTime   = 1654888526
      const mintFee = expandTo18Decimals(100)    
      let arkreenRECIssuanceExt: ArkreenRECIssuanceExt

      beforeEach(async () => {
        recMintRequest = { 
          issuer: manager.address, startTime, endTime,
          amountREC: BigNumber.from(1000), 
          cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte", 
          region: 'Beijing',
          url:"", memo:""
        } 
        const nonce1 = await AKREToken.nonces(owner1.address)
        const digest1 = await getApprovalDigest(
                                AKREToken,
                                { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                nonce1,
                                constants.MaxUint256
                              )
        const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
        signature = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 

        // Normal
        await arkreenRegistry.setArkreenMiner(arkreenMiner.address)        
        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
        tokenID = await arkreenRECIssuance.totalSupply()

        arkreenRECIssuanceExt = ArkreenRECIssuanceExt__factory.connect(arkreenRECIssuance.address, deployer);

      })

      it("ArkreenRECIssuanceExt: cancelRECRequest Abnormal", async () => {
        await expect(arkreenRECIssuanceExt.connect(owner2).cancelRECRequest(tokenID ))
                .to.be.revertedWith("AREC: Not Owner") 

        await expect(arkreenRECIssuanceExt.connect(owner1).cancelRECRequest(tokenID))
                .to.be.revertedWith("AREC: Wrong Status") 
     
      })

      it("ArkreenRECIssuanceExt: cancelRECRequest Normal", async () => {
        await arkreenRECIssuance.connect(manager).rejectRECRequest(tokenID)  
        await expect(arkreenRECIssuanceExt.connect(owner1).cancelRECRequest(tokenID))
                .to.emit(arkreenRECIssuance, "RECCanceled")
                .withArgs(owner1.address, tokenID)

        let recData = [ manager.address,  "",  owner1.address,
                        startTime,  endTime,
                        BigNumber.from(1000), 
                        BigNumber.from(RECStatus.Cancelled),
                        "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte", 
                        "Beijing", "", "", 0 ]

        expect(await arkreenRECIssuance.getRECData(tokenID)).to.deep.eq(recData);

        let payInfo = [constants.AddressZero, BigNumber.from(0)]
        expect(await arkreenRECIssuance.allPayInfo(tokenID)).to.deep.eq(payInfo);

      })
    })

    describe("certifyRECRequest", () => {
      let tokenID: BigNumber
      let signature: SignatureStruct
      let recMintRequest: RECRequestStruct 
      const startTime = 1564888526
      const endTime   = 1654888526
      const mintFee = expandTo18Decimals(100)    

      beforeEach(async () => {
        recMintRequest = { 
          issuer: manager.address, startTime, endTime,
          amountREC: BigNumber.from(1000), 
          cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte", 
          region: 'Beijing',
          url:"", memo:""
        } 
        const nonce1 = await AKREToken.nonces(owner1.address)
        const digest1 = await getApprovalDigest(
                                AKREToken,
                                { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                nonce1,
                                constants.MaxUint256
                              )
        const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
        signature = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 

        // Normal
        await arkreenRegistry.setArkreenMiner(arkreenMiner.address)        
        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
        tokenID = await arkreenRECIssuance.totalSupply()
      })

      it("ArkreenRECIssuanceExt: certifyRECRequest Abnormal", async () => {
        await arkreenRegistry.addRECIssuer(maker1.address, arkreenRECToken.address, "Arkreen Issuer Maker") 
        await expect(arkreenRECIssuance.connect(owner2).certifyRECRequest(tokenID,"Serial12345678" ))
                .to.be.revertedWith("AREC: Not Issuer") 

        await expect(arkreenRECIssuance.connect(maker1).certifyRECRequest(tokenID,"Serial12345678" ))
                .to.be.revertedWith("AREC: Wrong Issuer") 

        await arkreenRECIssuance.connect(manager).rejectRECRequest(tokenID)    
        await expect(arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID,"Serial12345678" ))
                .to.be.revertedWith("AREC: Wrong Status")         
     
      })

      it("ArkreenRECIssuanceExt: certifyRECRequest Normal", async () => {
        await expect(arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678"))
                .to.emit(arkreenRECIssuance, "RECCertified")
                .withArgs(manager.address, tokenID)

        let recData = [ manager.address,  "Serial12345678",  owner1.address,
                        startTime,  endTime,
                        BigNumber.from(1000), 
                        BigNumber.from(RECStatus.Certified),
                        "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte", 
                        "Beijing", "", "", 0 ]

        expect(await arkreenRECIssuance.getRECData(tokenID)).to.deep.eq(recData);
        expect(await arkreenRECIssuance.allRECByIssuer(manager.address)).to.deep.eq(BigNumber.from(1000));

        expect(await arkreenRECIssuance.allRECByIssuer(manager.address)).to.deep.eq(BigNumber.from(1000));
        expect(await arkreenRECIssuance.allRECIssued()).to.deep.eq(BigNumber.from(1000));
        expect(await arkreenRECIssuance.paymentByIssuer(manager.address, AKREToken.address)).to.deep.eq(expandTo18Decimals(100));

        let payInfo = [constants.AddressZero, BigNumber.from(0)]
        expect(await arkreenRECIssuance.allPayInfo(tokenID)).to.deep.eq(payInfo);

      })
    })


    describe("redeem", () => {
      it("ArkreenRECIssuanceExt: redeem", async () => {

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
        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
        const tokenID = await arkreenRECIssuance.totalSupply()

        // Abnormal Test
        // Abnormal 1: Not owner   
        await expect(arkreenRECIssuance.connect(owner2).redeem(tokenID))
                .to.be.revertedWith("AREC: Not Owner") 

        // Abnormal 2: Not Certified  
        await expect(arkreenRECIssuance.connect(owner1).redeem(tokenID))
                .to.be.revertedWith("AREC: Not Certified")  

        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")

        // Abnormal 3: Not owner
        await expect(arkreenRECIssuance.connect(owner2).redeem(tokenID))
                .to.be.revertedWith("AREC: Not Owner")  
      
        // Normal
        await expect(arkreenRECIssuance.connect(owner1).redeem(tokenID))
              .to.emit(arkreenRECIssuance, "RedeemFinished")
              .withArgs(owner1.address, tokenID, tokenID)     // Here offsetActionId is same as tokenID 

        const userActions = await arkreenRetirement.getUserEvents(owner1.address)

        const lastBlock = await ethers.provider.getBlock('latest')
        const offsetAction = [owner1.address, manager.address, expandTo18Decimals(1000),
                              tokenID, BigNumber.from(lastBlock.timestamp), false]

        expect(await arkreenRetirement.offsetActions(userActions[userActions.length-1])).to.deep.equal(offsetAction)

        let recData: RECDataStruct = await arkreenRECIssuance.getRECData(tokenID)
        expect(recData.status).to.equal(BigNumber.from(RECStatus.Retired));      
        
        expect(await arkreenRECIssuance.allRECRedeemed()).to.deep.eq(expandTo18Decimals(1000));
       
      })
    })

    describe("redeemFrom", () => {
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
        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
        tokenID = await arkreenRECIssuance.totalSupply()

      })

      it("ArkreenRECIssuanceExt: redeemFrom Abnormal", async () => {
        // Abnormal Test
        // Abnormal 1: Not owner   
        await expect(arkreenRECIssuance.connect(owner2).redeemFrom(owner1.address, tokenID))
                .to.be.revertedWith("AREC: Not Approved") 

        // Abnormal 2: Not Certified  
        await expect(arkreenRECIssuance.connect(owner1).redeemFrom(owner1.address, tokenID))
                .to.be.revertedWith("AREC: Not Certified")  

        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")

        // Abnormal 3: Not owner
        await expect(arkreenRECIssuance.connect(owner2).redeemFrom(owner1.address, tokenID))
                .to.be.revertedWith("AREC: Not Approved")  
      })

      it("ArkreenRECIssuanceExt: redeemFrom Normal", async () => {
        // Normal
        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")
        await expect(arkreenRECIssuance.connect(owner1).redeemFrom(owner1.address, tokenID))
              .to.emit(arkreenRECIssuance, "RedeemFinished")
              .withArgs(owner1.address, tokenID, tokenID)       // Here offsetActionId is same as tokenID 

        const userActions = await arkreenRetirement.getUserEvents(owner1.address)

        const lastBlock = await ethers.provider.getBlock('latest')
        const offsetAction = [owner1.address, manager.address, expandTo18Decimals(1000),
                              tokenID, BigNumber.from(lastBlock.timestamp), false]

        expect(await arkreenRetirement.offsetActions(userActions[userActions.length-1])).to.deep.equal(offsetAction)

        let recData: RECDataStruct = await arkreenRECIssuance.getRECData(tokenID)
        expect(recData.status).to.equal(BigNumber.from(RECStatus.Retired));   
        
        expect(await arkreenRECIssuance.allRECRedeemed()).to.deep.eq(expandTo18Decimals(1000));        
      })

      it("ArkreenRECIssuanceExt: redeemFrom by approval", async () => {
        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")

        // Abnormal 3: Not owner
        await expect(arkreenRECIssuance.connect(owner2).redeemFrom(owner1.address, tokenID))
                .to.be.revertedWith("AREC: Not Approved")  

        await arkreenRECIssuance.connect(owner1).approve(owner2.address,tokenID)
      
        // Normal
        await arkreenRECIssuance.connect(owner2).redeemFrom(owner1.address, tokenID)
      })

      it("ArkreenRECIssuanceExt: redeemFrom by approve for all", async () => {
        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")

        // Abnormal 3: Not owner
        await expect(arkreenRECIssuance.connect(owner2).redeemFrom(owner1.address, tokenID))
                .to.be.revertedWith("AREC: Not Approved")  

        await arkreenRECIssuance.connect(owner1).setApprovalForAll(owner2.address,true)
      
        // Normal
        await arkreenRECIssuance.connect(owner2).redeemFrom(owner1.address, tokenID)
      })
    })

    describe("redeemAndMintCertificate", () => {
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
        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
        tokenID = await arkreenRECIssuance.totalSupply()

        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")
      });
    
      it("ArkreenRECIssuanceExt: redeemAndMintCertificate", async () => {
        // Normal
        // offsetAndMintCertificate
        await arkreenRECIssuance.connect(owner1).redeemAndMintCertificate(
                  tokenID, owner1.address, "Owner","Alice","Save Earcth") 
      })
    
      it("ArkreenRECIssuanceExt: redeemAndMintCertificate by approval", async () => {
        // Abnormal: Not owner
        await expect(arkreenRECIssuance.connect(owner2).redeemFrom(owner1.address, tokenID))
                .to.be.revertedWith("AREC: Not Approved")  

        await arkreenRECIssuance.connect(owner1).approve(owner2.address, tokenID)
      
        // Normal
        // offsetAndMintCertificate
        await expect(arkreenRECIssuance.connect(owner2).redeemAndMintCertificate(
                        tokenID, owner1.address, "Owner","Alice","Save Earcth")) 
                .to.emit(arkreenRECIssuance, "RedeemFinished")
                .withArgs(owner1.address, tokenID, tokenID)         // Here offsetActionId is same as tokenID 
      })
    
      it("ArkreenRECIssuanceExt: redeemAndMintCertificate by approval for all", async () => {
        // Abnormal: Not owner
        await expect(arkreenRECIssuance.connect(owner2).redeemFrom(owner1.address, tokenID))
                .to.be.revertedWith("AREC: Not Approved")  

        await arkreenRECIssuance.connect(owner1).setApprovalForAll(owner2.address,true)
      
        // Normal
        // offsetAndMintCertificate
        await expect(arkreenRECIssuance.connect(owner2).redeemAndMintCertificate(
                        tokenID, owner1.address, "Owner","Alice","Save Earcth")) 
                .to.emit(arkreenRECIssuance, "RedeemFinished")
                .withArgs(owner1.address, tokenID, tokenID)         // Here offsetActionId is same as tokenID                         

        const lastBlock = await ethers.provider.getBlock('latest')
        const offsetID = await arkreenRetirement.offsetCounter()
        const certId = await arkreenRetirement.totalSupply()

        expect(await arkreenRECIssuance.allRECRedeemed()).to.deep.eq(expandTo18Decimals(1000));   
     
        const offsetRecord = [owner1.address, owner1.address, "Owner", "Alice", "Save Earcth", 
                              BigNumber.from(lastBlock.timestamp), expandTo18Decimals(1000), [offsetID]]
        expect(await arkreenRetirement.getCertificate(certId)).to.deep.equal(offsetRecord)
      })      
    })
    
    describe("liquidizeREC", () => {
      it("ArkreenRECIssuanceExt: liquidizeREC", async () => {

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
        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
        const tokenID = await arkreenRECIssuance.totalSupply()

        // Abnormal Test
        // Abnormal 1: Not owner
        await expect(arkreenRECIssuance.connect(owner2).liquidizeREC(tokenID))
                .to.be.revertedWith("AREC: Not Approved")  
                
        // Abnormal 2: Not Certified        
        await expect(arkreenRECIssuance.connect(owner1).liquidizeREC(tokenID))
                .to.be.revertedWith("AREC: Not Certified")       

        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")

        // Normal
        await expect(arkreenRECIssuance.connect(owner1).liquidizeREC(tokenID))
                .to.emit(arkreenRECIssuance, "RECLiquidized")
                .withArgs(owner1.address, tokenID, expandTo18Decimals(1000))

        expect(await arkreenRECToken.balanceOf(owner1.address)).to.equal(expandTo18Decimals(1000));
        expect(await arkreenRECIssuance.ownerOf(tokenID)).to.equal(arkreenRECToken.address);
      
        let recData: RECDataStruct = await arkreenRECIssuance.getRECData(tokenID)
        expect(recData.status).to.equal(BigNumber.from(RECStatus.Liquidized));

        expect(await arkreenRECIssuance.allRECLiquidized()).to.deep.eq(expandTo18Decimals(1000));  
    });
  })

  describe("tokenURI", () => {
    let tokenID: BigNumber
    let recMintRequest: RECRequestStruct
    let signature: SignatureStruct

    beforeEach(async () => {
      const startTime = 1564888526
      const endTime   = 1654888526
      
      recMintRequest = { 
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
      signature = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 
      
      // Mint
      await arkreenRegistry.setArkreenMiner(arkreenMiner.address)
    })

    it("ArkreenRECIssuanceExt: tokenURI, No given URI", async () => {
      await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
      tokenID = await arkreenRECIssuance.totalSupply()
      await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")
      expect( await arkreenRECIssuance.tokenURI(tokenID)).to.equal("https://www.arkreen.com/AREC/1");
    })

    it("ArkreenRECIssuanceExt: tokenURI, given URI", async () => {
      recMintRequest.url = "Shangxi"
      await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
      tokenID = await arkreenRECIssuance.totalSupply()
      await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")
      expect( await arkreenRECIssuance.tokenURI(tokenID)).to.equal("https://www.arkreen.com/AREC/Shangxi");

    })
  })

  describe("Mint Fee Withdraw", () => {
    let tokenID: BigNumber
    let recMintRequest: RECRequestStruct
    let signature: SignatureStruct
    const startTime = 1564888526
    const endTime   = 1654888526
    const mintFee = expandTo18Decimals(100)

    beforeEach(async () => {
      recMintRequest = { 
        issuer: manager.address, startTime, endTime,
        amountREC: expandTo18Decimals(1000), 
        cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte",
        region: 'Beijing',
        url:"", memo:""
      } 

      const nonce1 = await AKREToken.nonces(owner1.address)
      const digest1 = await getApprovalDigest(
                              AKREToken,
                              { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                              nonce1,
                              constants.MaxUint256
                            )
      const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
      signature = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 
      
      // Mint
      await arkreenRegistry.setArkreenMiner(arkreenMiner.address)
      await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
      tokenID = await arkreenRECIssuance.totalSupply()
      await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")
    })

    it("ArkreenRECIssuanceExt: Withdraw: zero address", async () => {
      await expect(arkreenRECIssuance.connect(owner1).withdraw(AKREToken.address, owner1.address))
              .to.be.revertedWith("Ownable: caller is not the owner")    

      const balance = await AKREToken.balanceOf(deployer.address)
      await arkreenRECIssuance.withdraw(AKREToken.address, constants.AddressZero)
      expect(await AKREToken.balanceOf(deployer.address)).to.equal(balance.add(mintFee))
    })

    it("ArkreenRECIssuanceExt: withdraw: given address", async () => {
      await arkreenRECIssuance.withdraw(AKREToken.address, owner2.address)
      expect(await AKREToken.balanceOf(owner2.address)).to.equal(mintFee)
    })
  })

  describe("REC NFT Transfer", () => {
    let tokenID: BigNumber
    let recMintRequest: RECRequestStruct
    let signature: SignatureStruct

    beforeEach(async () => {
      const startTime = 1564888526
      const endTime   = 1654888526
      
      recMintRequest = { 
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
      signature = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 
      
      // Mint
      await arkreenRegistry.setArkreenMiner(arkreenMiner.address)
      await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
      tokenID = await arkreenRECIssuance.totalSupply()
    })

    it("ArkreenRECIssuanceExt: Transfer: not allowed", async () => {
      await expect(arkreenRECIssuance.connect(owner1).transferFrom(owner1.address, owner2.address, tokenID))
              .to.be.revertedWith("AREC: Wrong Status")    

      await expect(arkreenRECIssuance.connect(owner1)["safeTransferFrom(address,address,uint256)"](
                    owner1.address, owner2.address, tokenID))
              .to.be.revertedWith("AREC: Wrong Status")    

      await expect(arkreenRECIssuance.connect(owner1)["safeTransferFrom(address,address,uint256,bytes)"](
                owner1.address, owner2.address, tokenID,"0x123456"))
          .to.be.revertedWith("AREC: Wrong Status")                  
    })

    it("ArkreenRECIssuanceExt: Transfer: Allowed", async () => {
      await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")
      await arkreenRECIssuance.connect(owner1)["safeTransferFrom(address,address,uint256)"](
                owner1.address, owner2.address, tokenID)
    })
  })

});
