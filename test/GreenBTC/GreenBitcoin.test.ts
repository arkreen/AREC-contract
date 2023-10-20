import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { constants, BigNumber, Contract } from 'ethers'
import { ethers, network, upgrades } from "hardhat";
import { ArkreenRECIssuanceExt__factory } from "../../typechain";

import {
    ArkreenToken,
    ArkreenMiner,
    ArkreenRECIssuance,
    ArkreenRECIssuanceExt,
    ArkreenRegistry,
    ArkreenRECToken,
    ArkreenBadge,
    ArkreenBuilder,
    ArkreenRECBank,
    GreenBTC,
    WETH9,
    ERC20F,
} from "../../typechain";

import { time, loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { getApprovalDigest, expandTo18Decimals, randomAddresses, getGreenBitcoinDigest, RECStatus, expandTo9Decimals } from "../utils/utilities";
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { RECRequestStruct, SignatureStruct, RECDataStruct } from "../../typechain/contracts/ArkreenRECIssuance";
import { boolean } from "hardhat/internal/core/params/argumentTypes";

// import { mineBlock } from "../utils/utilities";
// import { Web3Provider } from "@ethersproject/providers";

describe("GreenBTC Test Campaign", () => {
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
    let arkreenMiner:                 ArkreenMiner
    let arkreenRegistry:              ArkreenRegistry
    let arkreenRECIssuance:           ArkreenRECIssuance
    let arkreenRECIssuanceExt:        ArkreenRECIssuanceExt


    let arkreenRECToken:              ArkreenRECToken
    let arkreenRECTokenESG:           ArkreenRECToken
    let arkreenRetirement:            ArkreenBadge
    let arkreenBuilder:               ArkreenBuilder
    let arkreenRECBank:               ArkreenRECBank
    let greenBitcoin:                 GreenBTC

    let WETH:                         WETH9
    let tokenA:                       ERC20F

    const FORMAL_LAUNCH = 1682913600;         // 2024-05-01, 12:00:00
    const Miner_Manager       = 0 
    const MASK_OFFSET = BigNumber.from('0x8000000000000000')
    const MASK_DETAILS = BigNumber.from('0xC000000000000000')    

    const startTime = 1564888526
    const endTime   = 1654888526
    const region = "Shanghai"
    const url = "https://www.arkreen.com/AREC/"
    const memo = "Test Update"   
    const cID = "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte"        

    async function deployFixture() {
      let lastBlock = await ethers.provider.getBlock('latest')

      const AKRETokenFactory = await ethers.getContractFactory("ArkreenToken");
      const AKREToken = await upgrades.deployProxy(AKRETokenFactory, [10_000_000_000, deployer.address,'','']) as ArkreenToken
      await AKREToken.deployed();

      const ArkreenMinerFactory = await ethers.getContractFactory("ArkreenMiner")
      const arkreenMiner = await upgrades.deployProxy(ArkreenMinerFactory,
                                        [AKREToken.address, AKREToken.address, manager.address, register_authority.address]) as ArkreenMiner

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
      const arkreenRECTokenESG = await upgrades.deployProxy(ArkreenRECTokenESGFactory,[arkreenRegistry.address, maker1.address,'Classic Based AREC Token','CART']) as ArkreenRECToken
      await arkreenRECTokenESG.deployed()          
      
      const ArkreenRetirementFactory = await ethers.getContractFactory("ArkreenBadge")
      const arkreenRetirement = await upgrades.deployProxy(ArkreenRetirementFactory,[arkreenRegistry.address]) as ArkreenBadge
      await arkreenRetirement.deployed()     

      const ERC20Factory = await ethers.getContractFactory("ERC20F");
      const tokenA = await ERC20Factory.deploy(expandTo18Decimals(100000000),"Token A");
      await tokenA.deployed();

      const WETH9Factory = await ethers.getContractFactory("WETH9");
      const WETH = await WETH9Factory.deploy();
      await WETH.deployed();

      const ArkreenRECBankFactory = await ethers.getContractFactory("ArkreenRECBank")
      const arkreenRECBank = await upgrades.deployProxy(ArkreenRECBankFactory,[WETH.address]) as ArkreenRECBank
      await arkreenRECBank.deployed()   
  
      await AKREToken.transfer(owner1.address, expandTo18Decimals(30_000_000))
      await AKREToken.connect(owner1).approve(arkreenRECIssuance.address, expandTo18Decimals(30_000_000))
      await AKREToken.transfer(maker1.address, expandTo18Decimals(30_000_000))
      await AKREToken.connect(maker1).approve(arkreenRECIssuance.address, expandTo18Decimals(30_000_000))
      await AKREToken.connect(owner1).approve(arkreenMiner.address, expandTo18Decimals(30_000_000))
      await AKREToken.connect(maker1).approve(arkreenMiner.address, expandTo18Decimals(30_000_000))

      const miners = randomAddresses(2)
      await arkreenMiner.connect(manager).RemoteMinerOnboardInBatch([owner1.address, maker1.address], miners)
      // set formal launch

      const payer = maker1.address
 
      await arkreenMiner.setManager(Miner_Manager, manager.address)
      await arkreenMiner.ManageManufactures([payer], true)     

      await arkreenRegistry.addRECIssuer(manager.address, arkreenRECToken.address, "Arkreen Issuer")
      await arkreenRegistry.setRECIssuance(arkreenRECIssuance.address)
      await arkreenRegistry.setArkreenRetirement(arkreenRetirement.address)

      arkreenRECIssuanceExt = ArkreenRECIssuanceExt__factory.connect(arkreenRECIssuance.address, deployer);

      await arkreenRegistry.newAssetAREC('Test ARE', maker1.address, arkreenRECTokenESG.address,
                  AKREToken.address, BigNumber.from("0x3635c9adc5dea00000"), 1000, 'HashKey ESG BTC')

      const ArkreenBuilderFactory = await ethers.getContractFactory("ArkreenBuilder");
//    const arkreenBuilder = await ArkreenBuilderFactory.deploy(routerFeswa.address);
      arkreenBuilder = await upgrades.deployProxy(ArkreenBuilderFactory,[AKREToken.address, arkreenRECBank.address, WETH.address]) as ArkreenBuilder
      await arkreenBuilder.deployed();
      await arkreenBuilder.approveRouter([AKREToken.address, WETH.address])       
      await arkreenBuilder.approveArtBank([tokenA.address, WETH.address, AKREToken.address])      
      
      const GreenBTCFactory = await ethers.getContractFactory("GreenBTC");
      greenBitcoin = await upgrades.deployProxy(GreenBTCFactory,
                              [ register_authority.address, arkreenBuilder.address, arkreenRECTokenESG.address]) as GreenBTC
      await greenBitcoin.deployed();
      await greenBitcoin.approveBuilder([AKREToken.address, WETH.address])

      return { AKREToken, arkreenMiner, arkreenRegistry, arkreenRECIssuance, arkreenRECToken, arkreenRECTokenESG, 
               arkreenRetirement, arkreenRECIssuanceExt, arkreenRECBank, WETH, tokenA }
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
        arkreenRetirement = fixture.arkreenRetirement
        arkreenRECToken = fixture.arkreenRECToken
        arkreenRECTokenESG = fixture.arkreenRECTokenESG
        arkreenRECBank = fixture.arkreenRECBank
        WETH = fixture.WETH
        tokenA = fixture.tokenA
    }); 

    describe("GreenBTC Test", () => {

      beforeEach(async () => {
        {
          const startTime = 1564888526
          const endTime   = 1654888526
          
          let recMintRequest: RECRequestStruct = { 
            issuer: manager.address, startTime, endTime,
            amountREC: expandTo9Decimals(10000), 
            cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte",
            region: 'Beijing',
            url:"", memo:""
          } 

          const mintFee = expandTo18Decimals(10000* 1000)
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

          await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")

          // Normal
          await arkreenRECIssuance.connect(owner1).liquidizeREC(tokenID)

          await arkreenRECToken.connect(owner1).transfer(maker1.address, expandTo9Decimals(9000))
          await arkreenRECToken.connect(maker1).approve(arkreenRECBank.address, expandTo9Decimals(9000))
        }

        {
          let signature: SignatureStruct
          const mintFee = expandTo18Decimals(10000 *1000)    
          let tokenID: BigNumber          

          const nonce1 = await AKREToken.nonces(owner1.address)
          const digest1 = await getApprovalDigest(
                                  AKREToken,
                                  { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                  nonce1,
                                  constants.MaxUint256
                                )
          const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
          signature = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 

          await arkreenRECIssuanceExt.manageMVPAddress(true,[owner1.address])      

          await arkreenRECIssuanceExt.connect(owner1).mintESGBatch(1, expandTo9Decimals(10000), signature)
          tokenID = await arkreenRECIssuanceExt.totalSupply()

          await arkreenRECIssuanceExt.connect(owner1).updateRECDataExt(tokenID, startTime, endTime, cID, region, url, memo)                     
          await arkreenRECIssuance.connect(maker1).certifyRECRequest(tokenID, "Serial12345678")

          // Normal
          await arkreenRECIssuance.connect(owner1).liquidizeREC(tokenID)

          await arkreenRECTokenESG.connect(owner1).transfer(maker2.address, expandTo9Decimals(9000))
          await arkreenRECTokenESG.connect(maker2).approve(arkreenRECBank.address, expandTo9Decimals(9000))   

        }
      });

      ///////////////////////////////////////////

      it("GreenBTC Test: authMintGreenBTCWithApprove", async () => {

        await arkreenRECBank.addNewART( arkreenRECToken.address,  maker1.address)
        await arkreenRECBank.addNewART( arkreenRECTokenESG.address,  maker2.address)  
        
        await arkreenRECBank.connect(maker1).depositART( arkreenRECToken.address,  expandTo9Decimals(9000))
        await arkreenRECBank.connect(maker2).depositART( arkreenRECTokenESG.address,  expandTo9Decimals(9000))

        await arkreenRECToken.setClimateBuilder(arkreenBuilder.address)
        await arkreenRECTokenESG.setClimateBuilder(arkreenBuilder.address)

        const badgeInfo =  {
          beneficiary:    owner1.address,
          offsetEntityID: 'Owner1',
          beneficiaryID:  'Tester',
          offsetMessage:  "Just Testing"
        }    

        const greenBTCInfo =  {
            height: BigNumber.from(12345),
            ARTCount: expandTo9Decimals(12),  // 12 HART
            beneficiary: owner2.address,
            greenType: 1,
            blockTime: 'Apr 26, 2009 10:25 PM UTC',
            energyStr: '12.234 MWh'
        }

        await AKREToken.approve(arkreenBuilder.address, constants.MaxUint256)    
          
        await arkreenRECBank.connect(maker2).changeSalePrice( arkreenRECTokenESG.address, AKREToken.address, expandTo18Decimals(10))

        const amountPay = expandTo18Decimals(200)
        const amountART = expandTo9Decimals(20)

        const ARECBefore = await arkreenRECTokenESG.balanceOf(owner1.address)                    

        // const receiver = owner1.address
        const register_digest = getGreenBitcoinDigest(
                        'GreenBTC',
                        greenBitcoin.address,
                        { height:       greenBTCInfo.height,
                          energyStr:    greenBTCInfo.energyStr,
                          artCount:     greenBTCInfo.ARTCount,
                          blockTime:    greenBTCInfo.blockTime,
                          beneficiary:  greenBTCInfo.beneficiary,
                          greenType:    greenBTCInfo.greenType
                        }
                      )
  
        const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                              Buffer.from(privateKeyRegister.slice(2), 'hex'))           

        await arkreenBuilder.mangeTrustedForwarder(greenBitcoin.address, true)

        // Error: Check dealine
        const dealineBlock = await ethers.provider.getBlock('latest')
        
        await expect(greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                            {token: AKREToken.address, amount: amountPay}, dealineBlock.timestamp-1))
                    .to.be.revertedWith("GBTC: EXPIRED")    

        // Error: Check signature of Green Bitcoin info                    
        await expect(greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r:s,s}, badgeInfo, 
                                            {token: AKREToken.address, amount: amountPay}, constants.MaxUint256))
                    .to.be.revertedWith("GBTC: Invalid Singature")    

        // Error: Should approved before
        await expect(greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                            {token: AKREToken.address, amount: amountPay}, constants.MaxUint256))
                    .to.be.revertedWith("TransferHelper: TRANSFER_FROM_FAILED")    

        await AKREToken.connect(owner1).approve(greenBitcoin.address, constants.MaxUint256)     

        // Error: More ART required, so pay less
        await expect(greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                            {token: AKREToken.address, amount: expandTo18Decimals(120).sub(1)}, constants.MaxUint256))
                    .to.be.revertedWith("ARBK: Get Less")                        

        // Normal: authMintGreenBTCWithApprove                     
        await greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                            {token: AKREToken.address, amount: amountPay}, constants.MaxUint256)   

        const actionID =1     
        const lastBlock = await ethers.provider.getBlock('latest')
        
        const tokenID = await arkreenRECIssuance.totalSupply()
        const action = [  owner2.address, maker1.address, amountART,                // Manger is the issuer address
                          tokenID.add(MASK_OFFSET), lastBlock.timestamp, true ]     // Offset action is claimed
        expect(await arkreenRetirement.getOffsetActions(actionID)).to.deep.equal(action)

        const offsetRecord = [owner2.address, owner1.address, "Owner1", "Tester", "Just Testing", 
                              BigNumber.from(lastBlock.timestamp), amountART, [actionID]]
        const badgeID = 1                            
        expect(await arkreenRetirement.getCertificate(badgeID)).to.deep.equal(offsetRecord)
        expect(await arkreenRECTokenESG.balanceOf(owner1.address)).to.equal(ARECBefore)

        // Check dataGBTC
        const _dataGBTC = [ BigNumber.from(12345), expandTo9Decimals(12), owner2.address, 1,
                            'Apr 26, 2009 10:25 PM UTC', '12.234 MWh']

        expect(await greenBitcoin.dataGBTC(12345)).to.deep.equal(_dataGBTC)

        // Check dataGBTC
        const _dataNFT = [owner2.address, 12345, false, false, false, 0]
        expect(await greenBitcoin.dataNFT(12345)).to.deep.equal(_dataNFT)

        // Check NFT ID and owner
        expect(await greenBitcoin.ownerOf(12345)).to.equal(owner2.address)

        // Error: authMintGreenBTCWithApprove                     
        await expect(greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                            {token: AKREToken.address, amount: amountPay}, constants.MaxUint256))
                      .to.be.revertedWith("GBTC: Already Minted")                  

      });
      
      it("GreenBTC Test: openBox", async () => {

        await arkreenRECBank.addNewART( arkreenRECToken.address,  maker1.address)
        await arkreenRECBank.addNewART( arkreenRECTokenESG.address,  maker2.address)  
        
        await arkreenRECBank.connect(maker1).depositART( arkreenRECToken.address,  expandTo9Decimals(9000))
        await arkreenRECBank.connect(maker2).depositART( arkreenRECTokenESG.address,  expandTo9Decimals(9000))

        await arkreenRECToken.setClimateBuilder(arkreenBuilder.address)
        await arkreenRECTokenESG.setClimateBuilder(arkreenBuilder.address)

        const badgeInfo =  {
          beneficiary:    owner1.address,
          offsetEntityID: 'Owner1',
          beneficiaryID:  'Tester',
          offsetMessage:  "Just Testing"
        }    

        const greenBTCInfo =  {
            height: BigNumber.from(12345),
            ARTCount: expandTo9Decimals(12),  // 12 HART
            beneficiary: owner2.address,
            greenType: 1,
            blockTime: 'Apr 26, 2009 10:25 PM UTC',
            energyStr: '12.234 MWh'
        }

        await AKREToken.approve(arkreenBuilder.address, constants.MaxUint256)    
          
        await arkreenRECBank.connect(maker2).changeSalePrice( arkreenRECTokenESG.address, AKREToken.address, expandTo18Decimals(10))

        const amountPay = expandTo18Decimals(200)

        // const receiver = owner1.address
        const register_digest = getGreenBitcoinDigest(
                        'GreenBTC',
                        greenBitcoin.address,
                        { height:       greenBTCInfo.height,
                          energyStr:    greenBTCInfo.energyStr,
                          artCount:     greenBTCInfo.ARTCount,
                          blockTime:    greenBTCInfo.blockTime,
                          beneficiary:  greenBTCInfo.beneficiary,
                          greenType:    greenBTCInfo.greenType
                        }
                      )
  
        const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                              Buffer.from(privateKeyRegister.slice(2), 'hex'))           

        await arkreenBuilder.mangeTrustedForwarder(greenBitcoin.address, true)
        await AKREToken.connect(owner1).approve(greenBitcoin.address, constants.MaxUint256)            

        // Normal: authMintGreenBTCWithApprove                     
        await greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                            {token: AKREToken.address, amount: amountPay}, constants.MaxUint256)                                            

        // Error: More ART required, so pay less
        await expect(greenBitcoin.connect(owner1).openBox(12345)).to.be.revertedWith("GBTC: Not Owner")     
        
        const lastBlock0 = await ethers.provider.getBlock('latest')
        
        await expect(greenBitcoin.connect(owner2).openBox(12345))
                    .to.emit(greenBitcoin, 'OpenBox')
                    .withArgs(owner2.address, 12345, lastBlock0.number + 1)

        const lastBlock = await ethers.provider.getBlock('latest')

        // Check dataGBTC
        const _dataNFT = [owner2.address, 12345, true, false, false, 0]
        expect(await greenBitcoin.dataNFT(12345)).to.deep.equal(_dataNFT)    
        
        // Check dataGBTC
        const openingBoxList = [[12345, lastBlock.number]]
        expect(await greenBitcoin.getOpeningBoxList()).to.deep.equal(openingBoxList)    

        // Error: More ART required, so pay less
        await expect(greenBitcoin.connect(owner2).openBox(12345)).to.be.revertedWith("GBTC: Already Opened")   
        
        // 2nd Block: authMintGreenBTCWithApprove    
       { 
          const greenBTCInfo =  {
            height: BigNumber.from(23456),
            ARTCount: expandTo9Decimals(13),  // 13 HART
            beneficiary: owner2.address,
            greenType: 1,
            blockTime: 'Apr 26, 2012 10:25 PM UTC',
            energyStr: '13.234 MWh'
          }
          
          // const receiver = owner1.address
          const register_digest = getGreenBitcoinDigest(
                          'GreenBTC',
                          greenBitcoin.address,
                          { height:       greenBTCInfo.height,
                            energyStr:    greenBTCInfo.energyStr,
                            artCount:     greenBTCInfo.ARTCount,
                            blockTime:    greenBTCInfo.blockTime,
                            beneficiary:  greenBTCInfo.beneficiary,
                            greenType:    greenBTCInfo.greenType
                          }
                        )
    
          const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                                Buffer.from(privateKeyRegister.slice(2), 'hex'))   

          await greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                              {token: AKREToken.address, amount: amountPay}, constants.MaxUint256)  
        }
      
        await greenBitcoin.connect(owner2).openBox(23456)
        const lastBlock1 = await ethers.provider.getBlock('latest')

        // Check dataGBTC
        const _dataNFT1 = [owner2.address, 23456, true, false, false, 0]
        expect(await greenBitcoin.dataNFT(23456)).to.deep.equal(_dataNFT1)    
          
          // Check dataGBTC
        const openingBoxList1 = [[12345, lastBlock.number], [23456, lastBlock1.number]]
        expect(await greenBitcoin.getOpeningBoxList()).to.deep.equal(openingBoxList1)   
                                            
      });

      it("GreenBTC Test: revealBoxes", async () => {

        await arkreenRECBank.addNewART( arkreenRECToken.address,  maker1.address)
        await arkreenRECBank.addNewART( arkreenRECTokenESG.address,  maker2.address)  
        
        await arkreenRECBank.connect(maker1).depositART( arkreenRECToken.address,  expandTo9Decimals(9000))
        await arkreenRECBank.connect(maker2).depositART( arkreenRECTokenESG.address,  expandTo9Decimals(9000))

        await arkreenRECToken.setClimateBuilder(arkreenBuilder.address)
        await arkreenRECTokenESG.setClimateBuilder(arkreenBuilder.address)

        const badgeInfo =  {
          beneficiary:    owner1.address,
          offsetEntityID: 'Owner1',
          beneficiaryID:  'Tester',
          offsetMessage:  "Just Testing"
        }    

        const greenBTCInfo =  {
            height: BigNumber.from(12345),
            ARTCount: expandTo9Decimals(12),  // 12 HART
            beneficiary: owner2.address,
            greenType: 1,
            blockTime: 'Apr 26, 2009 10:25 PM UTC',
            energyStr: '12.234 MWh'
        }

        await AKREToken.approve(arkreenBuilder.address, constants.MaxUint256)    
          
        await arkreenRECBank.connect(maker2).changeSalePrice( arkreenRECTokenESG.address, AKREToken.address, expandTo18Decimals(10))

        const amountPay = expandTo18Decimals(200)

        // const receiver = owner1.address
        const register_digest = getGreenBitcoinDigest(
                        'GreenBTC',
                        greenBitcoin.address,
                        { height:       greenBTCInfo.height,
                          energyStr:    greenBTCInfo.energyStr,
                          artCount:     greenBTCInfo.ARTCount,
                          blockTime:    greenBTCInfo.blockTime,
                          beneficiary:  greenBTCInfo.beneficiary,
                          greenType:    greenBTCInfo.greenType
                        }
                      )
  
        const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                              Buffer.from(privateKeyRegister.slice(2), 'hex'))           

        await arkreenBuilder.mangeTrustedForwarder(greenBitcoin.address, true)
        await AKREToken.connect(owner1).approve(greenBitcoin.address, constants.MaxUint256)      
        
        // Mining 256 blocks to increase block height to to avoid internal panic !!!!!!!!!!!!!!!!
        await mine(256)

        // Normal: authMintGreenBTCWithApprove                     
        await greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                            {token: AKREToken.address, amount: amountPay}, constants.MaxUint256)                                            
        
        await greenBitcoin.connect(owner2).openBox(12345)

        // Nothing revealed 
        await expect(greenBitcoin.revealBoxes())
                .to.emit(greenBitcoin, 'RevealBoxes')
                .withArgs([], [])

        const openingBoxList = await greenBitcoin.getOpeningBoxList()
        expect(openingBoxList[0].tokenID).to.equal(12345)

        // 2nd Block: authMintGreenBTCWithApprove    
        { 
          const greenBTCInfo =  {
            height: BigNumber.from(23456),
            ARTCount: expandTo9Decimals(13),  // 13 HART
            beneficiary: owner2.address,
            greenType: 1,
            blockTime: 'Apr 26, 2012 10:25 PM UTC',
            energyStr: '13.234 MWh'
          }
          
          // const receiver = owner1.address
          const register_digest = getGreenBitcoinDigest(
                          'GreenBTC',
                          greenBitcoin.address,
                          { height:       greenBTCInfo.height,
                            energyStr:    greenBTCInfo.energyStr,
                            artCount:     greenBTCInfo.ARTCount,
                            blockTime:    greenBTCInfo.blockTime,
                            beneficiary:  greenBTCInfo.beneficiary,
                            greenType:    greenBTCInfo.greenType
                          }
                        )
    
          const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                                Buffer.from(privateKeyRegister.slice(2), 'hex'))   

          await greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                              {token: AKREToken.address, amount: amountPay}, constants.MaxUint256)  
        }

        // 3rd Block: authMintGreenBTCWithApprove    
        { 
          const greenBTCInfo =  {
            height: BigNumber.from(34567),
            ARTCount: expandTo9Decimals(14),  // 14 HART
            beneficiary: owner2.address,
            greenType: 1,
            blockTime: 'Apr 26, 2013 10:25 PM UTC',
            energyStr: '14.234 MWh'
          }
          
          // const receiver = owner1.address
          const register_digest = getGreenBitcoinDigest(
                          'GreenBTC',
                          greenBitcoin.address,
                          { height:       greenBTCInfo.height,
                            energyStr:    greenBTCInfo.energyStr,
                            artCount:     greenBTCInfo.ARTCount,
                            blockTime:    greenBTCInfo.blockTime,
                            beneficiary:  greenBTCInfo.beneficiary,
                            greenType:    greenBTCInfo.greenType
                          }
                        )
    
          const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                                Buffer.from(privateKeyRegister.slice(2), 'hex'))   

          await greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                              {token: AKREToken.address, amount: amountPay}, constants.MaxUint256)  
        }        

        await greenBitcoin.connect(owner2).openBox(23456)
        await greenBitcoin.connect(owner2).openBox(34567)

        const openingBoxList10 = await greenBitcoin.getOpeningBoxList()

        expect(openingBoxList10[0].tokenID).to.equal(12345)
        expect(openingBoxList10[1].tokenID).to.equal(23456)
        expect(openingBoxList10[2].tokenID).to.equal(34567)

        await greenBitcoin.revealBoxes()

        // Check dataGBTC
        expect((await greenBitcoin.dataNFT(12345))[3]).to.deep.equal(true)  
        expect((await greenBitcoin.dataNFT(23456))[3]).to.deep.equal(true)  
        expect((await greenBitcoin.dataNFT(34567))[3]).to.deep.equal(false)  
        
        const openingBoxList11 = await greenBitcoin.getOpeningBoxList()

        expect(openingBoxList11[0].tokenID).to.equal(34567)                   // only 34567 left

        await mine(1)

        // const revealList = [ 34567 ]
        // const wonList = [ false]

        await expect(greenBitcoin.revealBoxes())
                .to.emit(greenBitcoin, 'RevealBoxes')
        //      .withArgs(revealList, wonList)
       
        const openingBoxList2 = await greenBitcoin.getOpeningBoxList()
        expect(openingBoxList2.length).to.equal(0)  
                                            
      });

      it("GreenBTC Test: revealBoxesWithHash while overtime ", async () => {

        await arkreenRECBank.addNewART( arkreenRECToken.address,  maker1.address)
        await arkreenRECBank.addNewART( arkreenRECTokenESG.address,  maker2.address)  
        
        await arkreenRECBank.connect(maker1).depositART( arkreenRECToken.address,  expandTo9Decimals(9000))
        await arkreenRECBank.connect(maker2).depositART( arkreenRECTokenESG.address,  expandTo9Decimals(9000))

        await arkreenRECToken.setClimateBuilder(arkreenBuilder.address)
        await arkreenRECTokenESG.setClimateBuilder(arkreenBuilder.address)

        const badgeInfo =  {
          beneficiary:    owner1.address,
          offsetEntityID: 'Owner1',
          beneficiaryID:  'Tester',
          offsetMessage:  "Just Testing"
        }    

        const greenBTCInfo =  {
            height: BigNumber.from(12345),
            ARTCount: expandTo9Decimals(12),  // 12 HART
            beneficiary: owner2.address,
            greenType: 1,
            blockTime: 'Apr 26, 2009 10:25 PM UTC',
            energyStr: '12.234 MWh'
        }

        await AKREToken.approve(arkreenBuilder.address, constants.MaxUint256)    
          
        await arkreenRECBank.connect(maker2).changeSalePrice( arkreenRECTokenESG.address, AKREToken.address, expandTo18Decimals(10))

        const amountPay = expandTo18Decimals(200)

        // const receiver = owner1.address
        const register_digest = getGreenBitcoinDigest(
                        'GreenBTC',
                        greenBitcoin.address,
                        { height:       greenBTCInfo.height,
                          energyStr:    greenBTCInfo.energyStr,
                          artCount:     greenBTCInfo.ARTCount,
                          blockTime:    greenBTCInfo.blockTime,
                          beneficiary:  greenBTCInfo.beneficiary,
                          greenType:    greenBTCInfo.greenType
                        }
                      )
  
        const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                              Buffer.from(privateKeyRegister.slice(2), 'hex'))           

        await arkreenBuilder.mangeTrustedForwarder(greenBitcoin.address, true)
        await AKREToken.connect(owner1).approve(greenBitcoin.address, constants.MaxUint256)      
        
        // Mining 256 blocks to increase block height to to avoid internal panic !!!!!!!!!!!!!!!!
        await mine(256)

        let tx1, tx2, tx3, tx3A

        // Normal: authMintGreenBTCWithApprove                     
        tx1 = await greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                            {token: AKREToken.address, amount: amountPay}, constants.MaxUint256)     
        
        await greenBitcoin.connect(owner2).openBox(12345)

        // Nothing revealed 
        await expect(greenBitcoin.revealBoxes())
                .to.emit(greenBitcoin, 'RevealBoxes')
                .withArgs([], [])

        const openingBoxList = await greenBitcoin.getOpeningBoxList()
        expect(openingBoxList[0].tokenID).to.equal(12345)

        // 2nd Block: authMintGreenBTCWithApprove    
        { 
          const greenBTCInfo =  {
            height: BigNumber.from(23456),
            ARTCount: expandTo9Decimals(13),  // 13 HART
            beneficiary: owner2.address,
            greenType: 1,
            blockTime: 'Apr 26, 2012 10:25 PM UTC',
            energyStr: '13.234 MWh'
          }
          
          // const receiver = owner1.address
          const register_digest = getGreenBitcoinDigest(
                          'GreenBTC',
                          greenBitcoin.address,
                          { height:       greenBTCInfo.height,
                            energyStr:    greenBTCInfo.energyStr,
                            artCount:     greenBTCInfo.ARTCount,
                            blockTime:    greenBTCInfo.blockTime,
                            beneficiary:  greenBTCInfo.beneficiary,
                            greenType:    greenBTCInfo.greenType
                          }
                        )
    
          const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                                Buffer.from(privateKeyRegister.slice(2), 'hex'))   

          tx2 = await greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                              {token: AKREToken.address, amount: amountPay}, constants.MaxUint256)  
        }

        // 3rd Block: authMintGreenBTCWithApprove    
        { 
          const greenBTCInfo =  {
            height: BigNumber.from(34567),
            ARTCount: expandTo9Decimals(14),  // 14 HART
            beneficiary: owner2.address,
            greenType: 1,
            blockTime: 'Apr 26, 2013 10:25 PM UTC',
            energyStr: '14.234 MWh'
          }
          
          // const receiver = owner1.address
          const register_digest = getGreenBitcoinDigest(
                          'GreenBTC',
                          greenBitcoin.address,
                          { height:       greenBTCInfo.height,
                            energyStr:    greenBTCInfo.energyStr,
                            artCount:     greenBTCInfo.ARTCount,
                            blockTime:    greenBTCInfo.blockTime,
                            beneficiary:  greenBTCInfo.beneficiary,
                            greenType:    greenBTCInfo.greenType
                          }
                        )
    
          const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                                Buffer.from(privateKeyRegister.slice(2), 'hex'))   

          tx3 = await greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                              {token: AKREToken.address, amount: amountPay}, constants.MaxUint256)  
        }   
        
        // 3rd Block: authMintGreenBTCWithApprove    
        { 
          const greenBTCInfo =  {
            height: BigNumber.from(34568),
            ARTCount: expandTo9Decimals(18),  // 14 HART
            beneficiary: owner2.address,
            greenType: 1,
            blockTime: 'Apr 26, 2013 10:25 PM UTC',
            energyStr: '18.234 MWh'
          }
          
          // const receiver = owner1.address
          const register_digest = getGreenBitcoinDigest(
                          'GreenBTC',
                          greenBitcoin.address,
                          { height:       greenBTCInfo.height,
                            energyStr:    greenBTCInfo.energyStr,
                            artCount:     greenBTCInfo.ARTCount,
                            blockTime:    greenBTCInfo.blockTime,
                            beneficiary:  greenBTCInfo.beneficiary,
                            greenType:    greenBTCInfo.greenType
                          }
                        )
    
          const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                                Buffer.from(privateKeyRegister.slice(2), 'hex'))   

          tx3A = await greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                              {token: AKREToken.address, amount: amountPay}, constants.MaxUint256)  
        } 

        await greenBitcoin.connect(owner2).openBox(23456)
        await greenBitcoin.connect(owner2).openBox(34567)
        await greenBitcoin.connect(owner2).openBox(34568)

        await mine(252) // 252

        // 4th Block: authMintGreenBTCWithApprove    
        { 
          const greenBTCInfo =  {
            height: BigNumber.from(45678),
            ARTCount: expandTo9Decimals(15),  // 14 HART
            beneficiary: owner2.address,
            greenType: 1,
            blockTime: 'Apr 26, 2014 10:25 PM UTC',
            energyStr: '15.234 MWh'
          }
          
          // const receiver = owner1.address
          const register_digest = getGreenBitcoinDigest(
                          'GreenBTC',
                          greenBitcoin.address,
                          { height:       greenBTCInfo.height,
                            energyStr:    greenBTCInfo.energyStr,
                            artCount:     greenBTCInfo.ARTCount,
                            blockTime:    greenBTCInfo.blockTime,
                            beneficiary:  greenBTCInfo.beneficiary,
                            greenType:    greenBTCInfo.greenType
                          }
                        )
    
          const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                                Buffer.from(privateKeyRegister.slice(2), 'hex'))   

          await greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                              {token: AKREToken.address, amount: amountPay}, constants.MaxUint256)  
        }        


        // 5th Block: authMintGreenBTCWithApprove    
        { 
          const greenBTCInfo =  {
            height: BigNumber.from(56789),
            ARTCount: expandTo9Decimals(16),  // 14 HART
            beneficiary: owner2.address,
            greenType: 1,
            blockTime: 'Apr 26, 2015 10:25 PM UTC',
            energyStr: '16.234 MWh'
          }
          
          // const receiver = owner1.address
          const register_digest = getGreenBitcoinDigest(
                          'GreenBTC',
                          greenBitcoin.address,
                          { height:       greenBTCInfo.height,
                            energyStr:    greenBTCInfo.energyStr,
                            artCount:     greenBTCInfo.ARTCount,
                            blockTime:    greenBTCInfo.blockTime,
                            beneficiary:  greenBTCInfo.beneficiary,
                            greenType:    greenBTCInfo.greenType
                          }
                        )
    
          const {v,r,s} = ecsign( Buffer.from(register_digest.slice(2), 'hex'), 
                                                Buffer.from(privateKeyRegister.slice(2), 'hex'))   

          await greenBitcoin.connect(owner1).authMintGreenBTCWithApprove( greenBTCInfo, {v,r,s}, badgeInfo, 
                                              {token: AKREToken.address, amount: amountPay}, constants.MaxUint256)  
        }    

        await greenBitcoin.connect(owner2).openBox(45678)
        await greenBitcoin.connect(owner2).openBox(56789)

        const openingBoxList10 = await greenBitcoin.getOpeningBoxList()

        expect(openingBoxList10[0].tokenID).to.equal(12345)
        expect(openingBoxList10[1].tokenID).to.equal(23456)
        expect(openingBoxList10[2].tokenID).to.equal(34567)
        expect(openingBoxList10[3].tokenID).to.equal(34568)
        expect(openingBoxList10[4].tokenID).to.equal(45678)
        expect(openingBoxList10[5].tokenID).to.equal(56789)

        await greenBitcoin.revealBoxes()

        // Check dataGBTC
        expect((await greenBitcoin.dataNFT(12345))[3]).to.deep.equal(false)  
        expect((await greenBitcoin.dataNFT(23456))[3]).to.deep.equal(false)  
        expect((await greenBitcoin.dataNFT(34567))[3]).to.deep.equal(false)  
        expect((await greenBitcoin.dataNFT(34568))[3]).to.deep.equal(true)  
        expect((await greenBitcoin.dataNFT(45678))[3]).to.deep.equal(true)  
        expect((await greenBitcoin.dataNFT(56789))[3]).to.deep.equal(false)  
        
        const openingBoxList11 = await greenBitcoin.getOpeningBoxList()
        expect(openingBoxList11.length).to.equal(1) 
        expect(openingBoxList11[0].tokenID).to.equal(56789)                   // only 56789 left

        const overtimeBoxList = await greenBitcoin.getOvertimeBoxList() 
        expect(overtimeBoxList.length).to.equal(3) 
        expect(overtimeBoxList[0].tokenID).to.deep.equal(12345)  
        expect(overtimeBoxList[1].tokenID).to.deep.equal(23456)  
        expect(overtimeBoxList[2].tokenID).to.deep.equal(34567)  

        await mine(1)

        // const revealList = [ 34567 ]
        // const wonList = [ false]

        await expect(greenBitcoin.revealBoxes())
                .to.emit(greenBitcoin, 'RevealBoxes')
        //      .withArgs(revealList, wonList)
       
        const openingBoxList2 = await greenBitcoin.getOpeningBoxList()
        expect(openingBoxList2.length).to.equal(0)  

        // Error: Wrong length
        await expect(greenBitcoin.revealBoxesWithHash([12345, 23456], [tx2.hash]))
                .to.be.revertedWith("GBTC: Wrong Length")    

        // Error: Need manager
        await expect(greenBitcoin.connect(owner1).revealBoxesWithHash([23456], [tx2.hash]))
                .to.be.revertedWith("GBTC: Not Manager")       

        await greenBitcoin.revealBoxesWithHash([23456], [tx2.hash])
        const overtimeBoxList2 = await greenBitcoin.getOvertimeBoxList() 
        expect(overtimeBoxList2.length).to.equal(2)

        await greenBitcoin.revealBoxesWithHash([12345, 34567], [tx1.hash, tx3.hash])
        const overtimeBoxList3 = await greenBitcoin.getOvertimeBoxList() 
        expect(overtimeBoxList3.length).to.equal(0)         
                                            
      });

    })  

});
