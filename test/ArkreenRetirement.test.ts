import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { constants, BigNumber, Contract } from 'ethers'
import { ethers, network, upgrades } from "hardhat";

import {
    ArkreenToken,
    ArkreenMiner,
    ArkreenRECIssuance,
    ArkreenRegistery,
    ArkreenRECToken,
    ArkreenRetirement,
} from "../typechain";


import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { getApprovalDigest, expandTo18Decimals, randomAddresses, MinerType, RECStatus } from "./utils/utilities";
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { RECRequestStruct, SignatureStruct, RECDataStruct } from "../typechain/contracts/ArkreenRECIssuance";

describe("ArkreenRetirement", () => {
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

    let AKREToken:                    ArkreenToken
    let arkreenMiner:      ArkreenMiner
    let arkreenRegistery:             ArkreenRegistery
    let arkreenRECIssuance:           ArkreenRECIssuance
    let arkreenRECToken:              ArkreenRECToken
    let arkreenRetirement:            ArkreenRetirement

    const Miner_Manager       = 0         

    async function deployFixture() {
      const AKRETokenFactory = await ethers.getContractFactory("ArkreenToken");
      const AKREToken = await AKRETokenFactory.deploy(10_000_000_000);
      await AKREToken.deployed();

      const ArkreenMinerFactory = await ethers.getContractFactory("ArkreenMiner")
      const arkreenMiner = await upgrades.deployProxy(ArkreenMinerFactory,
                                        [AKREToken.address, manager.address, register_authority.address]) as ArkreenMiner

      await arkreenMiner.deployed()
 
      const ArkreenRegisteryFactory = await ethers.getContractFactory("ArkreenRegistery")
      const arkreenRegistery = await upgrades.deployProxy(ArkreenRegisteryFactory,[]) as ArkreenRegistery
      await arkreenRegistery.deployed()

      const ArkreenRECIssuanceFactory = await ethers.getContractFactory("ArkreenRECIssuance")
      const arkreenRECIssuance = await upgrades.deployProxy(ArkreenRECIssuanceFactory, 
                                  [AKREToken.address, arkreenRegistery.address]) as ArkreenRECIssuance
      await arkreenRECIssuance.deployed()

      const ArkreenRECTokenFactory = await ethers.getContractFactory("ArkreenRECToken")
      arkreenRECToken = await upgrades.deployProxy(ArkreenRECTokenFactory,[arkreenRegistery.address, manager.address]) as ArkreenRECToken
      await arkreenRECToken.deployed()     
      
      const ArkreenRetirementFactory = await ethers.getContractFactory("ArkreenRetirement")
      arkreenRetirement = await upgrades.deployProxy(ArkreenRetirementFactory,[arkreenRegistery.address]) as ArkreenRetirement
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

      await arkreenRegistery.addRECIssuer(manager.address, arkreenRECToken.address, "Arkreen Issuer")
      await arkreenRegistery.setRECIssuance(arkreenRECIssuance.address)
      await arkreenRegistery.setArkreenRetirement(arkreenRetirement.address)

      return {AKREToken, arkreenMiner, arkreenRegistery, arkreenRECIssuance, arkreenRECToken, arkreenRetirement}
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
        arkreenRegistery = fixture.arkreenRegistery
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
        await arkreenRegistery.setArkreenMiner(arkreenMiner.address)
//        await arkreenRECIssuance.managePaymentToken(AKREToken.address, true)
        const price0:BigNumber = expandTo18Decimals(50)
        await arkreenRECIssuance.updateARECMintPrice(AKREToken.address, price0)

        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
  
        const tokenID = await arkreenRECIssuance.totalSupply()
        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")
  
        await arkreenRECIssuance.connect(owner1).liquidizeREC(tokenID)

    });

    it("ArkreenRetirement: Basics", async () => {
        expect(await arkreenRetirement.NAME()).to.equal("Arkreen REC OFFSET Certificate");
        expect(await arkreenRetirement.SYMBOL()).to.equal("AROC");
    });

    it("ArkreenRetirement: setBaseURI", async () => {
      expect(await arkreenRetirement.baseURI()).to.equal("https://www.arkreen.com/retirement/");
      await arkreenRetirement.setBaseURI("https://www.arkreen.com/offset/")
      expect(await arkreenRetirement.baseURI()).to.equal("https://www.arkreen.com/offset/");
    });

    it("ArkreenRECIssuance: supportsInterface", async () => {   
      expect(await arkreenRetirement.supportsInterface("0x01ffc9a7")).to.equal(true);    // EIP165
      expect(await arkreenRetirement.supportsInterface("0x80ac58cd")).to.equal(true);    // ERC721
      expect(await arkreenRetirement.supportsInterface("0x780e9d63")).to.equal(true);    // ERC721Enumerable
      expect(await arkreenRetirement.supportsInterface("0x5b5e139f")).to.equal(true);    // ERC721Metadata
      expect(await arkreenRetirement.supportsInterface("0x150b7a02")).to.equal(true);   // ERC721TokenReceiver
    });     

    

    describe("registerOffset", () => {
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
        await arkreenRegistery.setArkreenMiner(arkreenMiner.address)
//      await arkreenRECIssuance.managePaymentToken(AKREToken.address, true)
        const price0:BigNumber = expandTo18Decimals(50)
        await arkreenRECIssuance.updateARECMintPrice(AKREToken.address, price0)

        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
        tokenID = await arkreenRECIssuance.totalSupply()
        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")
      })

      it("registerOffset: Wrong Issuer", async () => {
        await expect(arkreenRetirement.registerOffset(owner1.address, manager.address, 0, 0))
                .to.be.revertedWith("AROC: Wrong Issuer")
      })

      it("registerOffset: Less Amount (redeem) ", async () => {
        await arkreenRetirement.setMinOffsetAmount(expandTo18Decimals(1000).add(1))
        await expect(arkreenRECIssuance.connect(owner1).redeem(tokenID))
                .to.be.revertedWith("AROC: Less Amount")
      })

      it("registerOffset: Less Amount (offest) ", async () => {
        await arkreenRetirement.setMinOffsetAmount(expandTo18Decimals(10).add(1))
        await expect(arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10)))
                .to.be.revertedWith("AROC: Less Amount")
      })

      it("registerOffset: Normal (redeem) ", async () => {
        await arkreenRECIssuance.connect(owner1).redeem(tokenID)

        const userActions = await arkreenRetirement.getUserEvents(owner1.address)

        const lastBlock = await ethers.provider.getBlock('latest')
        const offsetAction = [owner1.address, manager.address, expandTo18Decimals(1000),
                              tokenID, BigNumber.from(lastBlock.timestamp), false]
        
        expect(await arkreenRetirement.offsetActions(userActions[userActions.length-1])).to.deep.equal(offsetAction)
        expect(await arkreenRetirement.totalOffsetRegistered()).to.deep.eq(expandTo18Decimals(1000));                
      })

      it("registerOffset: Normal (offest) ", async () => {
        await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))

        const offsetID1 = await arkreenRetirement.offsetCounter()
        const userActions = await arkreenRetirement.getUserEvents(owner1.address)
        expect(offsetID1).to.equal(userActions[userActions.length-1])

        const lastBlock = await ethers.provider.getBlock('latest')
        const offsetAction = [owner1.address, manager.address, expandTo18Decimals(10),
                              BigNumber.from(0), BigNumber.from(lastBlock.timestamp), false]                // TokenId must be zero
        
        expect(await arkreenRetirement.offsetActions(userActions[userActions.length-1])).to.deep.equal(offsetAction)
        expect(await arkreenRetirement.totalOffsetRegistered()).to.deep.eq(expandTo18Decimals(10));                
      })
    })

    describe("onERC721Received", () => {
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
        await arkreenRegistery.setArkreenMiner(arkreenMiner.address)
//      await arkreenRECIssuance.managePaymentToken(AKREToken.address, true)
        const price0:BigNumber = expandTo18Decimals(50)
        await arkreenRECIssuance.updateARECMintPrice(AKREToken.address, price0)        
        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
        tokenID = await arkreenRECIssuance.totalSupply()
      })

      
      it("ArkreenRetirement: onERC721Received Abnormal", async () => {
        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")   
        //  await expect(arkreenRECIssuance.connect(owner1).transferFrom(owner1.address, arkreenRetirement.address, tokenID))
        //          .to.be.revertedWith("AROC: Refused")
                
        await expect(arkreenRECIssuance.connect(owner1)["safeTransferFrom(address,address,uint256)"](
                    owner1.address, arkreenRetirement.address, tokenID))
                .to.be.revertedWith("AROC: Refused")
                
        await expect(arkreenRECIssuance.connect(owner1)["safeTransferFrom(address,address,uint256,bytes)"](
                  owner1.address, arkreenRetirement.address, tokenID, "0x123456"))
              .to.be.revertedWith("AROC: Refused")
      })

      it("ArkreenRetirement: onERC721Received Normal", async () => {
        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")   
        await arkreenRECIssuance.connect(owner1).redeem(tokenID)
        expect(await arkreenRetirement.totalRedeemed()).to.equals(expandTo18Decimals(1000));    
      })      

      it("ArkreenRetirement: onERC721Received Normal", async () => {
        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")  
        await arkreenRECIssuance.connect(owner1).setApprovalForAll(owner2.address,true)
        await arkreenRECIssuance.connect(owner2).redeemFrom(owner1.address, tokenID)
        expect(await arkreenRetirement.totalRedeemed()).to.equals(expandTo18Decimals(1000));    
      })   
      
      it("ArkreenRetirement: onERC721Received Normal", async () => {
        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")   
        await arkreenRECIssuance.connect(owner1).redeemAndMintCertificate(
                                        tokenID, owner1.address, "Owner","Alice","Save Earcth")
        expect(await arkreenRetirement.totalRedeemed()).to.equals(expandTo18Decimals(1000));    
      })   
    })    

    describe("mintCertificate", () => {
      it("ArkreenRetirement: mintCertificate", async () => {
        // commitOffset
        await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
        const offsetID1 = await arkreenRetirement.offsetCounter()

        await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
        const offsetID2 = await arkreenRetirement.offsetCounter()

        // mintCertificate
        await expect(arkreenRetirement.connect(owner2).mintCertificate(
                    owner1.address, owner1.address, "Owner","","Save Earcth",[offsetID1,offsetID2])) 
                .to.be.revertedWith("AROC: Caller Not Allowed")

        await arkreenRetirement.connect(owner1).mintCertificate(owner1.address, owner1.address, "Owner","","Save Earcth",[offsetID1,offsetID2]) 
        const certId = await arkreenRetirement.totalSupply()
        const lastBlock = await ethers.provider.getBlock('latest')

        const offsetRecord1 = [owner1.address, owner1.address, "Owner", "", "Save Earcth", 
                              BigNumber.from(lastBlock.timestamp), expandTo18Decimals(20), [offsetID1,offsetID2]]

        expect(await arkreenRetirement.getCertificate(certId)).to.deep.equal(offsetRecord1)    
        expect(await arkreenRetirement.totalOffsetRetired()).to.equal(expandTo18Decimals(20))  
        expect( await arkreenRetirement.tokenURI(certId)).to.equal("https://www.arkreen.com/retirement/1");     
        await arkreenRetirement.setBaseURI("https://www.arkreen.com/offset/")
        expect( await arkreenRetirement.tokenURI(certId)).to.equal("https://www.arkreen.com/offset/1"); 
      });
    })

    describe("updateCertificate", () => {
      it("ArkreenRetirement: updateCertificate", async () => {
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
        await expect(arkreenRetirement.connect(owner2).updateCertificate(certId, owner1.address, "Kitty","Alice",""))
                .to.be.revertedWith("AROC: Not Owner")

        expect(await arkreenRetirement.connect(owner1).updateCertificate(certId, owner1.address, "Kitty","Alice",""))
                .to.emit(arkreenRetirement, "OffsetCertificateUpdated")
                .withArgs(certId)         // Here offsetActionId is same as tokenID 

        const offsetRecord2 = [owner1.address, owner1.address, "Kitty", "Alice", "Save Earcth", 
                              BigNumber.from(lastBlock.timestamp), expandTo18Decimals(30), [offsetID1,offsetID2,offsetID3]]

        expect(await arkreenRetirement.getCertificate(certId)).to.deep.equal(offsetRecord2)

        await time.increaseTo(lastBlock.timestamp + 3 *24 * 3600 + 1)    // 3 days
        await expect(arkreenRetirement.connect(owner1).updateCertificate(certId, owner1.address, "Kitty","Alice",""))
                .to.be.revertedWith("AROC: Time Elapsed")
      });
    })

    describe("attachOffsetEvents", () => {

      it("ArkreenRetirement: attachOffsetEvents", async () => {
        // commitOffset
      await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
      const offsetID1 = await arkreenRetirement.offsetCounter()

      await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
      const offsetID2 = await arkreenRetirement.offsetCounter()
      
      await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
      const offsetID3 = await arkreenRetirement.offsetCounter()

      // mintCertificate
      await arkreenRetirement.connect(owner1).mintCertificate(owner1.address, owner1.address, 
                                                              "Owner","","Save Earcth",[offsetID1,offsetID2]) 
      const certId = await arkreenRetirement.totalSupply()
      const lastBlock = await ethers.provider.getBlock('latest')

      expect(await arkreenRetirement.totalOffsetRetired()).to.equal(expandTo18Decimals(20))

      // attachOffsetEvents
      await arkreenRetirement.connect(owner1).attachOffsetEvents(certId, [offsetID3])

      await expect(arkreenRetirement.connect(owner1).attachOffsetEvents(certId, [offsetID3]))
              .to.be.revertedWith("AROC: Already Claimed")

      await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(10))
      const offsetID4 = await arkreenRetirement.offsetCounter()
      
      // updateCertificate
      await expect(arkreenRetirement.connect(owner2).attachOffsetEvents(certId, [offsetID4]))
              .to.be.revertedWith("AROC: Not Owner")

      await time.increaseTo(lastBlock.timestamp + 3 *24 * 3600 + 1)    // 3 days
      await expect(arkreenRetirement.connect(owner1).attachOffsetEvents(certId, [offsetID4]))
                      .to.be.revertedWith("AROC: Time Elapsed")

      const offsetRecord2 = [owner1.address, owner1.address, "Owner", "", "Save Earcth", 
                            BigNumber.from(lastBlock.timestamp), expandTo18Decimals(30), [offsetID1,offsetID2,offsetID3]]

      expect(await arkreenRetirement.getCertificate(certId)).to.deep.equal(offsetRecord2)

    });
  })
});
