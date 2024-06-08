import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
const {ethers, upgrades} =  require("hardhat");
import hre from 'hardhat'
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { getGreenBitcoinClaimGifts, getApprovalDigest, expandTo18Decimals, randomAddresses, expandTo9Decimals } from '../utils/utilities'
import { constants, BigNumber, } from 'ethers'

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
    KWhToken,
    WETH9,
    ERC20F,
    GreenBTC2,
    GreenBTCGift,
    GreenBTCGift__factory,
    GreenBTC2__factory,
    ArkreenToken__factory,
    ArkreenTokenTest__factory
    // ArkreenTokenV2,
    // ArkreenTokenV2__factory
} from "../../typechain";

import { RECRequestStruct, SignatureStruct, RECDataStruct } from "../../typechain/contracts/ArkreenRECIssuance";
const constants_MaxDealine = BigNumber.from('0xFFFFFFFF')

describe("GreenBTC2 Test Campaign", ()=>{

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
    let arkreenRetirement:            ArkreenBadge
    let arkreenBuilder:               ArkreenBuilder
    let arkreenRECBank:               ArkreenRECBank
    let kWhToken:                     KWhToken

    let WETH:                         WETH9
    let tokenA:                       ERC20F
    let greenBTC2:                    GreenBTC2
    let greenBTCGift:                 GreenBTCGift
   

    const FORMAL_LAUNCH = 1682913600;         // 2024-05-01, 12:00:00
    const Miner_Manager       = 0 

    async function deployFixture() {
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
    
        await AKREToken.transfer(owner1.address, expandTo18Decimals(300_000_000))
        await AKREToken.connect(owner1).approve(arkreenRECIssuance.address, expandTo18Decimals(300_000_000))
        await AKREToken.transfer(maker1.address, expandTo18Decimals(300_000_000))
        await AKREToken.connect(maker1).approve(arkreenRECIssuance.address, expandTo18Decimals(300_000_000))
        await AKREToken.connect(owner1).approve(arkreenMiner.address, expandTo18Decimals(300_000_000))
        await AKREToken.connect(maker1).approve(arkreenMiner.address, expandTo18Decimals(300_000_000))
  
        const miners = randomAddresses(2)
        await arkreenMiner.connect(manager).RemoteMinerOnboardInBatch([owner1.address, maker1.address], miners)
  
        const payer = maker1.address
        await arkreenMiner.setManager(Miner_Manager, manager.address)
        await arkreenMiner.ManageManufactures([payer], true)     
  
        await arkreenRegistry.addRECIssuer(manager.address, arkreenRECToken.address, "Arkreen Issuer")
        await arkreenRegistry.setRECIssuance(arkreenRECIssuance.address)
        await arkreenRegistry.setArkreenRetirement(arkreenRetirement.address)
  
        const ArkreenBuilderFactory = await ethers.getContractFactory("ArkreenBuilder");
        arkreenBuilder = await upgrades.deployProxy(ArkreenBuilderFactory,[AKREToken.address, arkreenRECBank.address, WETH.address]) as ArkreenBuilder
        await arkreenBuilder.deployed();

        await arkreenBuilder.approveRouter([AKREToken.address, WETH.address])       
        await arkreenBuilder.approveArtBank([tokenA.address, WETH.address, manager.address])     
        
        const kWhFactory = await ethers.getContractFactory("KWhToken");
        const kWhToken = await upgrades.deployProxy(kWhFactory,
                                [ arkreenRECToken.address, arkreenRECBank.address, 
                                  arkreenBuilder.address, manager.address ]) as KWhToken
        await kWhToken.deployed()

        await kWhToken.approveBank([tokenA.address, WETH.address, AKREToken.address])       

        const GreenBTC2Factory = await ethers.getContractFactory("GreenBTC2")
        const greenBTC2 = await upgrades.deployProxy(GreenBTC2Factory, [kWhToken.address, manager.address]) as GreenBTC2
        await greenBTC2.deployed()

        const GreenBTCGiftFactory = await ethers.getContractFactory("GreenBTCGift")
        const greenBTCGift = await upgrades.deployProxy(GreenBTCGiftFactory, [greenBTC2.address, AKREToken.address]) as GreenBTCGift
        await greenBTCGift.deployed()


        const value10000 = BigNumber.from(10000).mul(256).add(18)     // 10000 AKRE
        const value1000 = BigNumber.from(1000).mul(256).add(18)       // 10000 AKRE
        const value100 = BigNumber.from(100).mul(256).add(18)         // 10000 AKRE

        const value50000 = BigNumber.from(50000).mul(256).add(18)     // 50000 AKRE
        const value5000 = BigNumber.from(5000).mul(256).add(18)       // 5000 AKRE
        const value500 = BigNumber.from(500).mul(256).add(18)         // 500 AKRE

        await greenBTCGift.initGift(1, BigNumber.from(AKREToken.address).shl(96).add(value10000).toHexString())
        await greenBTCGift.initGift(2, BigNumber.from(AKREToken.address).shl(96).add(value1000).toHexString())
        await greenBTCGift.initGift(3, BigNumber.from(AKREToken.address).shl(96).add(value100).toHexString())

        await greenBTCGift.initGift(81, BigNumber.from(tokenA.address).shl(96).add(value50000).toHexString())
        await greenBTCGift.initGift(82, BigNumber.from(tokenA.address).shl(96).add(value5000).toHexString())
        await greenBTCGift.initGift(83, BigNumber.from(tokenA.address).shl(96).add(value500).toHexString())

        await greenBTC2.setGreenBTCGift(greenBTCGift.address)

        await tokenA.transfer(greenBTC2.address, expandTo18Decimals(30000000))
        await AKREToken.transfer(greenBTC2.address, expandTo18Decimals(30000000))

        await greenBTC2.approveGift([tokenA.address, AKREToken.address])

        return { AKREToken, arkreenMiner, arkreenRegistry, arkreenRECIssuance, arkreenRECToken, 
          arkreenRetirement, arkreenRECIssuanceExt, arkreenRECBank, kWhToken, WETH, tokenA,
          greenBTC2, greenBTCGift }
    }

    describe('GreenBTC2 test', () => {

      const domainInfo = {
                x: 5,  y: 6, w:  7, h: 8,
                boxTop: 3000,
                chance1: 15,   chance2: 200, chance3: 1000, chance4: 0,
                ratio1: 500,   ratio2: 1500, ratio3: 0,     ratio4: 0,
                allchance: 0
              }

      const ratiosSum = 15 + 200 + 1000 + 500 + 1500

      const convertRatio = (chance: number) => Math.floor((65536 * chance +5000) / 10000)

      const sum = convertRatio(15) + convertRatio(200) + convertRatio(1000) +
                  convertRatio(500) + convertRatio(1500)

      const domainInfoBigInt= BigNumber.from(domainInfo.x).shl(248)
                         .add(BigNumber.from(domainInfo.y).shl(240))
                         .add(BigNumber.from(domainInfo.w).shl(232))
                         .add(BigNumber.from(domainInfo.h).shl(224))
                         .add(BigNumber.from(domainInfo.boxTop).shl(192))
                         .add(BigNumber.from(domainInfo.chance1).shl(176))
                         .add(BigNumber.from(domainInfo.chance2).shl(160))
                         .add(BigNumber.from(domainInfo.chance3).shl(144))
                         .add(BigNumber.from(domainInfo.chance4).shl(128))
                         .add(BigNumber.from(domainInfo.ratio1).shl(112))
                         .add(BigNumber.from(domainInfo.ratio2).shl(96))
                         .add(BigNumber.from(domainInfo.ratio3).shl(80))
                         .add(BigNumber.from(domainInfo.ratio4).shl(64))
                         .add(BigNumber.from(1).shl(56))
                         .add(BigNumber.from(2).shl(48))
                         .add(BigNumber.from(3).shl(40))
                         .add(BigNumber.from(81).shl(24))
                         .add(BigNumber.from(82).shl(16))

      const chance1Converted =  convertRatio(domainInfo.chance1)
      const chance2Converted =  chance1Converted + convertRatio(domainInfo.chance2)
      const chance3Converted =  chance2Converted + convertRatio(domainInfo.chance3)
      const chance4Converted =  chance3Converted + convertRatio(domainInfo.chance4)
      const chance5Converted =  chance4Converted + convertRatio(domainInfo.ratio1)
      const chance6Converted =  chance5Converted + convertRatio(domainInfo.ratio2)
      const chance7Converted =  chance6Converted + convertRatio(domainInfo.ratio3)
      const chance8Converted =  chance7Converted + convertRatio(domainInfo.ratio4)

      const domainInfoBigIntConverted = BigNumber.from(domainInfo.x).shl(248)
                         .add(BigNumber.from(domainInfo.y).shl(240))
                         .add(BigNumber.from(domainInfo.w).shl(232))
                         .add(BigNumber.from(domainInfo.h).shl(224))
                         .add(BigNumber.from(domainInfo.boxTop).shl(192))
                         .add(BigNumber.from(chance1Converted).shl(176))
                         .add(BigNumber.from(chance2Converted).shl(160))
                         .add(BigNumber.from(chance3Converted).shl(144))
                         .add(BigNumber.from(chance4Converted).shl(128))
                         .add(BigNumber.from(chance5Converted).shl(112))
                         .add(BigNumber.from(chance6Converted).shl(96))
                         .add(BigNumber.from(chance7Converted).shl(80))
                         .add(BigNumber.from(chance8Converted).shl(64))
                         .add(BigNumber.from(1).shl(56))
                         .add(BigNumber.from(2).shl(48))
                         .add(BigNumber.from(3).shl(40))
                         .add(BigNumber.from(81).shl(24))
                         .add(BigNumber.from(82).shl(16))

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
        arkreenRECBank = fixture.arkreenRECBank
        kWhToken = fixture.kWhToken
        WETH = fixture.WETH
        tokenA = fixture.tokenA
        greenBTC2 = fixture.greenBTC2
        greenBTCGift = fixture.greenBTCGift

        {
          const startTime = 1564888526
          const endTime   = 1654888526
          
          let recMintRequest: RECRequestStruct = { 
            issuer: manager.address, startTime, endTime,
            amountREC: expandTo9Decimals(50000), 
            cID: "bafybeihepmxz4ytc4ht67j73nzurkvsiuxhsmxk27utnopzptpo7wuigte",
            region: 'Beijing',
            url:"", memo:""
          } 

          const mintFee = expandTo18Decimals(50000* 1000)
          const nonce1 = await AKREToken.nonces(owner1.address)
          const digest1 = await getApprovalDigest(
                                  AKREToken,
                                  { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                  nonce1,
                                  constants_MaxDealine
                                )
          const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
          const signature: SignatureStruct = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants_MaxDealine } 
          
          const price0:BigNumber = expandTo18Decimals(1000).div(expandTo9Decimals(1))
          await arkreenRECIssuance.updateARECMintPrice(AKREToken.address, price0)

          // Mint
          await arkreenRegistry.setArkreenMiner(arkreenMiner.address)
          await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
          const tokenID = await arkreenRECIssuance.totalSupply()

          await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")

          // Normal
          await arkreenRECIssuance.connect(owner1).liquidizeREC(tokenID)

          await arkreenRECToken.connect(owner1).transfer(maker1.address, expandTo9Decimals(9000))
          await arkreenRECToken.connect(maker1).approve(arkreenRECBank.address, expandTo9Decimals(9000))

          await arkreenRECBank.addNewART( arkreenRECToken.address,  maker1.address)
          await arkreenRECBank.connect(maker1).depositART( arkreenRECToken.address,  expandTo9Decimals(9000))
          await arkreenRECToken.setClimateBuilder(arkreenBuilder.address)
  
          const badgeInfo =  {
            beneficiary:    owner1.address,
            offsetEntityID: 'Owner1',
            beneficiaryID:  'Tester',
            offsetMessage:  "Just Testing"
          }    
  
          await kWhToken.setBadgeInfo(badgeInfo)
  
          // MintKWh with ART
          await arkreenRECToken.connect(owner1).transfer(kWhToken.address, expandTo9Decimals(20000))
          await arkreenRECToken.connect(owner1).transfer(deployer.address, expandTo9Decimals(5000))

          await kWhToken.changeSwapPrice(arkreenRECToken.address, expandTo9Decimals(1))

          // Normal MintKWh                         
          await kWhToken.MintKWh( arkreenRECToken.address, expandTo9Decimals(20000))

          await arkreenRECToken.approve(kWhToken.address, constants.MaxUint256)
          await kWhToken.convertKWh(arkreenRECToken.address, expandTo9Decimals(5000))

          await arkreenRECToken.connect(owner1).approve(kWhToken.address, constants.MaxUint256)
          await kWhToken.connect(owner1).convertKWh(arkreenRECToken.address, expandTo9Decimals(5000))

        }
        
      });


      it("GreenBTC2 basics test", async function () {

        await AKREToken.transfer(greenBTC2.address, expandTo18Decimals(100000000))

        const domainID = 1

        const registerDomainTx = await greenBTC2.registerDomain(domainID, domainInfoBigInt.toHexString())

        expect(await greenBTC2.getDomain(1)).to.eq(domainInfoBigIntConverted)
        
        const domain = await  greenBTC2.getDomain(1)

        //console.log("WWWWWWWWWWWWWWWW", registerDomainTx, domain);
        //console.log("WWWWWWWWWWWWWWWW", domain);

        await kWhToken.connect(owner1).approve(greenBTC2.address, constants.MaxUint256)

        const greenizetx = await  greenBTC2.connect(owner1).makeGreenBox(1,123)
        const receipt = await greenizetx.wait()

        const blockHash = receipt.blockHash
        const blockHeight = receipt.blockNumber

        await mine(5)

        const Bytes32_Zero = "0x0000000000000000000000000000000000000000000000000000000000000000"
        const shotResult = await greenBTC2.checkIfShot(owner1.address, 1, Bytes32_Zero)

        //console.log("VVVVVVVVVVVVVVVV", receipt, shotResult);
        //console.log("VVVVVVVVVVVVVVVV", shotResult);

        const digest = getGreenBitcoinClaimGifts(
            'Green BTC Club',
            greenBTC2.address,
            1,
            blockHeight,
            blockHash
          )

        const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))   

        const claimActionGiftsTx = await greenBTC2.connect(owner1).openActionGifts(1, blockHeight, blockHash, {v,r,s})
        const claimReceipt = await claimActionGiftsTx.wait()

        //console.log("JJJJJJJJJJJJJ", claimReceipt);


        const amount1 = await greenBTCGift.balanceOf(owner1.address, 1)
        const amount2 = await greenBTCGift.balanceOf(owner1.address, 2)
        const amount3 = await greenBTCGift.balanceOf(owner1.address, 3)

        const balanceAKREGift = await AKREToken.balanceOf(greenBTCGift.address);

        //console.log("KKKKKKKKKKKKKKK", amount1, amount2, amount3, AKREToken.address, balanceAKREGift.toHexString());

        const claimGiftTX = await greenBTCGift.connect(owner1).claimGift(3, BigNumber.from(2))

        const claimGiftReceipt = await claimGiftTX.wait()

        //console.log("HHHHHHHHHHHHHHHHHH", claimGiftReceipt);

//        const claimMultiGiftsTX = await greenBTCGift.claimMultiGifts([1,2,3], [amount1, amount2, amount3.sub(BigNumber.from(2))])
//        const claimMultiGiftsReceipt = await claimMultiGiftsTX.wait()
//        console.log("MMMMMMMMMMMMMMM", claimMultiGiftsReceipt);
        
      });


      it("GreenBTC2 GreenBTCGift+ClaimGift Test", async function () {

        // AKRE used for gift
        await AKREToken.approve(greenBTC2.address, constants.MaxUint256)
        await greenBTC2.depositFund(AKREToken.address, expandTo18Decimals(100000000))

        await greenBTC2.registerDomain(1, domainInfoBigInt.toHexString())

        await kWhToken.connect(owner1).approve(greenBTC2.address, constants.MaxUint256)
        const greenizetx = await  greenBTC2.connect(owner1).makeGreenBox(1,123)
        const receipt = await greenizetx.wait()

        const digest = getGreenBitcoinClaimGifts(
            'Green BTC Club',
            greenBTC2.address,
            1,
            receipt.blockNumber,
            receipt.blockHash
          )

        const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))   

        await mine(5)
        await greenBTC2.connect(owner1).openActionGifts(1, receipt.blockNumber, receipt.blockHash, {v,r,s})

        const amount3 = await greenBTCGift.balanceOf(owner1.address, 3)
        const balanace1 = await AKREToken.balanceOf(owner1.address)
        const unitGift = expandTo18Decimals(100)

        await expect(greenBTCGift.connect(owner1).claimGift(5, amount3))
                .to.be.revertedWith("GBTC: Wrong Gift ID")

        expect(await greenBTCGift.connect(owner1).claimGift(3, BigNumber.from(2)))
                .to.emit(tokenA, 'GiftClaimed')
                .withArgs(owner1.address, 3, BigNumber.from(2))

        expect(await greenBTCGift.balanceOf(owner1.address, 3)).to.eq(amount3.sub(BigNumber.from(2)))
        expect(await AKREToken.balanceOf(owner1.address)).to.eq(balanace1.add(unitGift.mul(2)))

        await greenBTCGift.connect(owner1).claimGift(3, amount3.sub(BigNumber.from(2)))

        expect(await greenBTCGift.balanceOf(owner1.address, 3)).to.eq(0)
        expect(await AKREToken.balanceOf(owner1.address)).to.eq(balanace1.add(unitGift.mul(amount3)))

        await expect(greenBTCGift.connect(owner1).claimGift(3, 1))
                .to.be.revertedWith("ERC1155: burn amount exceeds balance")

        await expect(greenBTCGift.connect(owner1).claimGift(3, 0))
                .to.be.revertedWith("GBTC: Zero Amout")

        const amount1 = await greenBTCGift.balanceOf(owner1.address, 1)
        const amount2 = await greenBTCGift.balanceOf(owner1.address, 2)

        if(!amount1.isZero()) await greenBTCGift.connect(owner1).claimGift(1, amount1)
        if(!amount2.isZero()) await greenBTCGift.connect(owner1).claimGift(2, amount2)
      });

      it("GreenBTC2 claimMultiGifts test", async function () {

        await AKREToken.transfer(greenBTC2.address, expandTo18Decimals(100000000))

        const domainID = 1

        const registerDomainTx = await greenBTC2.registerDomain(domainID, domainInfoBigInt.toHexString())

        expect(await greenBTC2.getDomain(1)).to.eq(domainInfoBigIntConverted)
        
        const domain = await  greenBTC2.getDomain(1)

        //console.log("WWWWWWWWWWWWWWWW", registerDomainTx, domain);
        //console.log("WWWWWWWWWWWWWWWW", domain);

        await kWhToken.connect(owner1).approve(greenBTC2.address, constants.MaxUint256)

        const greenizetx = await  greenBTC2.connect(owner1).makeGreenBox(1,123)
        const receipt = await greenizetx.wait()

        const blockHash = receipt.blockHash
        const blockHeight = receipt.blockNumber

        await mine(5)

        const Bytes32_Zero = "0x0000000000000000000000000000000000000000000000000000000000000000"
        const shotResult = await greenBTC2.checkIfShot(owner1.address, 1, Bytes32_Zero)

        //console.log("VVVVVVVVVVVVVVVV", receipt, shotResult);
        //console.log("VVVVVVVVVVVVVVVV", shotResult);

        const digest = getGreenBitcoinClaimGifts(
            'Green BTC Club',
            greenBTC2.address,
            1,
            blockHeight,
            blockHash
          )

        const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))   

        const claimActionGiftsTx = await greenBTC2.connect(owner1).openActionGifts(1, blockHeight, blockHash, {v,r,s})
        const claimReceipt = await claimActionGiftsTx.wait()

        //console.log("JJJJJJJJJJJJJ", claimReceipt);


        const amount1 = await greenBTCGift.balanceOf(owner1.address, 1)
        const amount2 = await greenBTCGift.balanceOf(owner1.address, 2)
        const amount3 = await greenBTCGift.balanceOf(owner1.address, 3)

        const balanceAKREGift = await AKREToken.balanceOf(greenBTCGift.address);

        console.log("KKKKKKKKKKKKKKK", amount1, amount2, amount3, AKREToken.address, balanceAKREGift.toHexString());

        const claimGiftTX = await greenBTCGift.connect(owner1).claimGift(3, BigNumber.from(2))

        const claimGiftReceipt = await claimGiftTX.wait()

        const balanceAKREGiftA = await AKREToken.balanceOf(greenBTCGift.address);

        console.log("HHHHHHHHHHHHHHHHHH", amount1, amount2, amount3, balanceAKREGiftA);

        const claimMultiGiftsTX = await greenBTCGift.connect(owner1).claimGiftBatch([2,3], [amount2, amount3.sub(BigNumber.from(2))])

        const claimMultiGiftsReceipt = await claimMultiGiftsTX.wait()

        // console.log("MMMMMMMMMMMMMMM", claimMultiGiftsReceipt);
        
      });


    })
})