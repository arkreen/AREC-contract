import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { constants, BigNumber, Contract, utils, providers } from 'ethers'

import { ethers, network, upgrades } from "hardhat";
//import { waffle } from "hardhat"

import {
    ArkreenTokenTest,
    ArkreenMiner,
    ArkreenRECIssuance,
    ArkreenRegistry,
    ArkreenRECToken,
    ArkreenBadge,
    ArkreenOperator,
} from "../typechain";

import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { getApprovalDigest, expandTo18Decimals, randomAddresses, RECStatus, MinerType, 
          BigNumberPercent, expandTo9Decimals } from "./utils/utilities";
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { RECRequestStruct, SignatureStruct, RECDataStruct } from "../typechain/contracts/ArkreenRECIssuance";
import { OffsetActionStruct }  from "../typechain/contracts/ArkreenBadge";
import FeSwapPair from '../artifacts/contracts/Dex/FeSwapPair.sol/FeSwapPair.json'

//const { provider, createFixtureLoader } = waffle;

const MASK_OFFSET = BigNumber.from('0x8000000000000000')
const MASK_DETAILS = BigNumber.from('0xC000000000000000')
const initPoolPrice = expandTo18Decimals(1).div(5)
const BidStartTime: number = 1687190400   // 2023/06/20 00/00/00
const OPEN_BID_DURATION: number =  (3600 * 24 * 14)
const rateTriggerArbitrage: number = 10

const overrides = {
  gasLimit: 30000000
}

describe("ArkreenOperator", () => {
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

    let wallet:     SignerWithAddress;
    let feeTo:      SignerWithAddress;
    let pairOwner:  SignerWithAddress;

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

    let tokenA: Contract
    let tokenB: Contract
    let WETH: Contract
    let WETHPartner: Contract
    let router: Contract
    let pairAAB: Contract
    let pairABB: Contract
    let WETHPairTTE: Contract
    let WETHPairTEE: Contract    
    let routerEventEmitter: Contract

    let pairTTArt: Contract
    let pairTAArt: Contract
    let pairEEArt: Contract
    let pairEAArt: Contract
    let arkreenOperator: Contract
      
    async function deployFixture() {

      const bytecode = `${FeSwapPair.bytecode}`

      console.log("utils.keccak256(bytecode): ", utils.keccak256(bytecode)) 

      // deploy FeSwap Token contract, sending the total supply to the deployer
      let lastBlock = await ethers.provider.getBlock('latest')
      // const Feswa = await deployContract(wallet, FeswapTokenCode, [wallet.address, wallet.address, lastBlock.timestamp + 60 * 60])
      const FeswFactory = await ethers.getContractFactory("Fesw");
      const Feswa = await FeswFactory.deploy(wallet.address, wallet.address, lastBlock.timestamp + 60 * 60,'FESW');
      await Feswa.deployed();

      // Get Factory address
      const FeswFactoryAddress = Contract.getContractAddress({ from: wallet.address, nonce: 2 })
      const FeswRouterAddress = Contract.getContractAddress({ from: wallet.address, nonce: 5 })

      // deploy FeSwap NFT contract
      // const FeswaNFT = await deployContract(wallet, FeswaNFTCode, [Feswa.address, FeswFactoryAddress, BidStartTime], overrides)
      const FeswaNFTFactory = await ethers.getContractFactory("FeswaNFT");
      const FeswaNFT = await FeswaNFTFactory.deploy(Feswa.address, FeswFactoryAddress, BidStartTime);
      await FeswaNFT.deployed();

      // deploy FeSwap factory
      // const factoryFeswa = await deployContract(wallet, FeSwapFactory, [wallet.address, FeswRouterAddress, FeswaNFT.address], overrides)
      const FeSwapFactory = await ethers.getContractFactory("FeSwapFactory");
      const factoryFeswa = await FeSwapFactory.deploy(wallet.address, FeswRouterAddress, FeswaNFT.address);
      await factoryFeswa.deployed();

      // const WETH = await deployContract(wallet, WETH9)
      const WETH9Factory = await ethers.getContractFactory("WETH9");
      const WETH = await WETH9Factory.deploy();
      await WETH.deployed();

      // const WETHPartner = await deployContract(wallet, ERC20, [expandTo18Decimals(10000),"WETH Partner"], overrides)
      const ERC20Factory = await ethers.getContractFactory("ERC20F");
      const WETHPartner = await ERC20Factory.deploy(expandTo18Decimals(3000000),"WETH Partner");
      await WETHPartner.deployed();

      // deploy FeSwap routers
      // const routerFeswa = await deployContract(wallet, FeSwapRouter, [factoryFeswa.address, WETH.address], overrides)
      const FeSwapRouterFactory = await ethers.getContractFactory("FeSwapRouter");
      const routerFeswa = await FeSwapRouterFactory.deploy(factoryFeswa.address, WETH.address);
      await routerFeswa.deployed();

      // deploy tokens
      // const tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000),"Token A"])
      const tokenA = await ERC20Factory.deploy(expandTo18Decimals(10000),"Token A");
      await tokenA.deployed();

      // const tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000),"Token B"])
      const tokenB = await ERC20Factory.deploy(expandTo18Decimals(10000),"Token B");
      await tokenB.deployed();

      await Feswa.transfer(FeswaNFT.address, expandTo18Decimals(1000_000))

      // event emitter for testing
      // const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [])
      const RouterEventEmitterFactory = await ethers.getContractFactory("RouterEventEmitter");
      const routerEventEmitter = await RouterEventEmitterFactory.deploy();
      await routerEventEmitter.deployed();

      // initialize FeSwap
      await factoryFeswa.setFeeTo(feeTo.address)
      await factoryFeswa.setRouterFeSwap(routerFeswa.address)
      // await factoryFeswa.createUpdatePair(tokenA.address, tokenB.address, pairOwner.address, rateTriggerArbitrage, overrides)

//    await mineBlock(ethers.provider, BidStartTime + 1)
      await time.increaseTo(BidStartTime + 1)
      const tokenIDMatch = utils.keccak256( 
      utils.solidityPack( ['address', 'address', 'address'],
      (tokenA.address.toLowerCase() <= tokenB.address.toLowerCase())
      ? [FeswaNFT.address, tokenA.address, tokenB.address] 
      : [FeswaNFT.address, tokenB.address, tokenA.address] ) )

      await FeswaNFT.connect(pairOwner).BidFeswaPair(tokenA.address, tokenB.address, pairOwner.address,
      { ...overrides, value: initPoolPrice } )

      // BidDelaying time out
      lastBlock = await ethers.provider.getBlock('latest')
//    await mineBlock(ethers.provider, lastBlock.timestamp + OPEN_BID_DURATION + 1 ) 
      await time.increaseTo(lastBlock.timestamp + OPEN_BID_DURATION + 1)

      await FeswaNFT.connect(pairOwner).ManageFeswaPair(tokenIDMatch, pairOwner.address, rateTriggerArbitrage, 0 )

      await factoryFeswa.createUpdatePair(tokenB.address, WETHPartner.address, pairOwner.address, rateTriggerArbitrage, 0, overrides)  
      const [pairAddressAAB, pairAddressABB] = await factoryFeswa.getPair(tokenA.address, tokenB.address)

      // const pairAddressABB = await factoryFeswa.getPair(tokenB.address, tokenA.address)
      const pairAAB = new Contract(pairAddressAAB, JSON.stringify(FeSwapPair.abi), ethers.provider).connect(wallet)
      const pairABB = new Contract(pairAddressABB, JSON.stringify(FeSwapPair.abi), ethers.provider).connect(wallet)

      await factoryFeswa.createUpdatePair(WETH.address, WETHPartner.address, pairOwner.address, rateTriggerArbitrage, 0, overrides)
      const [WETHPairAddressETHIn, WETHPairAddressETHOut] = await factoryFeswa.getPair(WETH.address, WETHPartner.address)
      const WETHPairTEE = new Contract(WETHPairAddressETHIn, JSON.stringify(FeSwapPair.abi), ethers.provider).connect(wallet)

      // const WETHPairAddressETHOut = await factoryFeswa.getPair(WETHPartner.address, WETH.address)
      const WETHPairTTE = new Contract(WETHPairAddressETHOut, JSON.stringify(FeSwapPair.abi), ethers.provider).connect(wallet)

      // deploy FeSwap MetamorphicContractFactory
      // const MetamorphicFactory = await deployContract(wallet, MetamorphicContractFactory)

      const MetamorphicContractFactory = await ethers.getContractFactory("MetamorphicContractFactory");
      const MetamorphicFactory = await MetamorphicContractFactory.deploy();
      await MetamorphicFactory.deployed();

      ////////////////////////////////////////////////////////////////////////////////////////

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
      
      await factoryFeswa.createUpdatePair(WETHPartner.address, arkreenRECToken.address, pairOwner.address, rateTriggerArbitrage, 0, overrides)
      const [pairAddressTTArt, pairAddressTAArt] = await factoryFeswa.getPair(WETHPartner.address, arkreenRECToken.address)
      const pairTTArt = new Contract(pairAddressTTArt, JSON.stringify(FeSwapPair.abi), ethers.provider).connect(wallet)
      const pairTAArt = new Contract(pairAddressTAArt, JSON.stringify(FeSwapPair.abi), ethers.provider).connect(wallet)

      await factoryFeswa.createUpdatePair(WETH.address, arkreenRECToken.address, pairOwner.address, rateTriggerArbitrage, 0, overrides)
      const [pairAddressEEArt, pairAddressEAArt] = await factoryFeswa.getPair(WETH.address, arkreenRECToken.address)
      const pairEEArt = new Contract(pairAddressEEArt, JSON.stringify(FeSwapPair.abi), ethers.provider).connect(wallet)
      const pairEAArt = new Contract(pairAddressEAArt, JSON.stringify(FeSwapPair.abi), ethers.provider).connect(wallet)
  
      await AKREToken.transfer(owner1.address, expandTo18Decimals(10000))
      await AKREToken.connect(owner1).approve(arkreenRECIssuance.address, expandTo18Decimals(10000))

      await AKREToken.transfer(maker1.address, expandTo18Decimals(10000))
      await AKREToken.connect(maker1).approve(arkreenRECIssuance.address, expandTo18Decimals(10000))
      
      await AKREToken.connect(owner1).approve(arkreenMiner.address, expandTo18Decimals(10000))
      await AKREToken.connect(maker1).approve(arkreenMiner.address, expandTo18Decimals(10000))
      
      await WETHPartner.transfer(maker1.address, expandTo18Decimals(1000000))
      await WETHPartner.transfer(owner1.address, expandTo18Decimals(1000000))

      const miners = randomAddresses(2)
      await arkreenMiner.connect(manager).VirtualMinerOnboardInBatch([owner1.address, maker1.address], miners)

      // set formal launch
      lastBlock = await ethers.provider.getBlock('latest')
      await arkreenMiner.setLaunchTime(lastBlock.timestamp+5)
      await time.increaseTo(lastBlock.timestamp+5)

      const payer = maker1.address
      await arkreenMiner.setManager(Miner_Manager, manager.address)
      await arkreenMiner.ManageManufactures([payer], true)     

      await arkreenRegistry.addRECIssuer(manager.address, arkreenRECToken.address, "Arkreen Issuer")
      await arkreenRegistry.setRECIssuance(arkreenRECIssuance.address)
      await arkreenRegistry.setArkreenRetirement(arkreenRetirement.address)

      const ArkreenOperatorFactory = await ethers.getContractFactory("ArkreenOperator");
//    const arkreenOperator = await ArkreenOperatorFactory.deploy(routerFeswa.address);
      arkreenOperator = await upgrades.deployProxy(ArkreenOperatorFactory,[routerFeswa.address, WETH.address]) as ArkreenOperator
      await arkreenOperator.deployed();
      await arkreenOperator.approveRouter([WETHPartner.address, WETH.address])

      return {  tokenA,
        tokenB, WETH, WETHPartner, factoryFeswa,
        routerFeswa, routerEventEmitter, pairAAB, pairABB,
        WETHPairTTE, WETHPairTEE, Feswa, FeswaNFT,
        tokenIDMatch, MetamorphicFactory, 
        pairTTArt, pairTAArt,  pairEEArt, pairEAArt,
        AKREToken, arkreenMiner, arkreenRegistry, arkreenRECIssuance, 
        arkreenRECToken, arkreenRetirement, arkreenOperator }
    }

    beforeEach(async () => {
        [deployer, manager, register_authority, fund_receiver, owner1, owner2, miner1, miner2, maker1, maker2] = await ethers.getSigners();
        wallet = deployer
        feeTo = manager
        pairOwner = register_authority

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

        tokenA = fixture.tokenA
        tokenB = fixture.tokenB
        WETH = fixture.WETH
        WETHPartner = fixture.WETHPartner
        router = fixture.routerFeswa
        pairAAB = fixture.pairAAB
        pairABB = fixture.pairABB      
        WETHPairTTE = fixture.WETHPairTTE
        WETHPairTEE = fixture.WETHPairTEE    
        routerEventEmitter = fixture.routerEventEmitter
        pairTTArt = fixture.pairTTArt  
        pairTAArt = fixture.pairTAArt  
        pairEEArt = fixture.pairEEArt  
        pairEAArt = fixture.pairEAArt  
        arkreenOperator = fixture.arkreenOperator  
        
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

    describe( "Arkreen Operator Test: Buying ART with token", () => {

      let tokenID: BigNumber

      async function mintAREC(amountREC: number) {
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
        const nonce1 = await AKREToken.nonces(owner1.address)
        const digest1 = await getApprovalDigest(
                                AKREToken,
                                { owner: owner1.address, spender: arkreenRECIssuance.address, value: mintFee },
                                nonce1,
                                constants.MaxUint256
                              )
        const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
        const signature: SignatureStruct = { v, r, s, token: AKREToken.address, value:mintFee, deadline: constants.MaxUint256 } 
        
        await arkreenRECIssuance.connect(owner1).mintRECRequest(recMintRequest, signature)
        tokenID = await arkreenRECIssuance.totalSupply()
  
        await arkreenRECIssuance.connect(manager).certifyRECRequest(tokenID, "Serial12345678")
        await arkreenRECIssuance.connect(owner1).liquidizeREC(tokenID)
      }

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

      async function addLiquidityTTA(tokenTTAmount: BigNumber, tokenArtAmount: BigNumber, ratio: Number) {
        await WETHPartner.connect(maker1).approve(router.address, constants.MaxUint256)
        await arkreenRECToken.connect(maker1).approve(router.address, constants.MaxUint256)
        await router.connect(maker1).addLiquidity(
            {
              tokenA:         WETHPartner.address,
              tokenB:         arkreenRECToken.address,
              amountADesired: tokenTTAmount,
              amountBDesired: tokenArtAmount,
              amountAMin:     0,
              amountBMin:     0,
              ratio:          ratio,
            },
            wallet.address,
            constants.MaxUint256,
            overrides
          )
      }

      async function addLiquidityEEA(ETHAmount: BigNumber, tokenArtAmount: BigNumber, ratio: Number) {
        await arkreenRECToken.connect(maker1).approve(router.address, constants.MaxUint256)
        await router.connect(maker1).addLiquidityETH(
            {
              token:              arkreenRECToken.address,
              amountTokenDesired: tokenArtAmount,
              amountTokenMin:     0,
              amountETHMin:       0,
              ratio:              ratio,
            },
            maker1.address,
            constants.MaxUint256,
            { ...overrides, value: ETHAmount }
          )
      }

      beforeEach(async () => {
        // Mint
        await arkreenRegistry.setArkreenMiner(arkreenMiner.address)
        const price0:BigNumber = expandTo18Decimals(50)
        await arkreenRECIssuance.updateARECMintPrice(AKREToken.address, price0)
        await mintAREC(5000)        // 2 :  45      // 1:1000
        await mintAREC(600)         // 3:   51
        await mintAREC(8000)        // 4:  131
        await mintAREC(900)         // 5
        await mintAREC(1000)        // 6
        await mintAREC(2000)        // 7
        await mintAREC(9000)        // 8
        await mintAREC(800)         // 9
        await mintAREC(3000)        // 10:  298
  
        await mintAREC(5000)        // 11
        await mintAREC(600)         // 12
        await mintAREC(8000)        // 13
        await mintAREC(500)         // 14
        await mintAREC(1000)        // 15
        await mintAREC(2000)        // 16:  469
        await mintAREC(9000)        // 17:  559
        await mintAREC(800)         // 18
        await mintAREC(3000)        // 19： 597
        await mintAREC(500)                   // 20:  602
        await mintARECMaker(2000000)          // 21:  602        
  
      })

      it("ActionOperatorNative: Exact Payment MATIC", async () => {
        await mintAREC(5000)          // 2

        await arkreenRECToken.setClimateOperator(arkreenOperator.address)
  
        const tokenETHAmount = expandTo18Decimals(1000)
        const tokenArtAmount = expandTo9Decimals(1000000)
        await addLiquidityEEA(tokenETHAmount, tokenArtAmount, 0)      // should be 0 here

        const amountPay = expandTo18Decimals(10)
        const amountART = expandTo9Decimals(0)
        const badgeInfo =  {
                  beneficiary:    owner1.address,
                  offsetEntityID: 'Owner1',
                  beneficiaryID:  'Tester',
                  offsetMessage:  "Just Testing A"
                }

        // Normal transaction
        const expectedOutputAmount  = amountPay.mul(tokenArtAmount).div(tokenETHAmount.add(amountPay))   
        await expect(arkreenOperator.connect(owner1).actionOperatorBadgeNative(arkreenRECToken.address,
                            amountART, true, constants.MaxUint256 , badgeInfo, {value: amountPay}))
                            .to.emit(WETH, 'Deposit')
                            .withArgs(arkreenOperator.address, amountPay)
                            .to.emit(WETH, 'Transfer')
                            .withArgs(arkreenOperator.address, pairEEArt.address, amountPay)
                            .to.emit(arkreenRECToken, 'Transfer')
                            .withArgs(pairEEArt.address, arkreenOperator.address, expectedOutputAmount)
                            .to.emit(pairEEArt, 'Sync')
                            .withArgs(tokenETHAmount.add(amountPay), tokenArtAmount.sub(expectedOutputAmount))
                            .to.emit(pairEEArt, 'Swap')
                            .withArgs(router.address, amountPay, 0, expectedOutputAmount, arkreenOperator.address)  
                            .to.emit(arkreenRetirement, "OffsetCertificateMinted")
                            .withArgs(1)           
                            .to.emit(arkreenRetirement, "Locked")
                            .withArgs(1)      

        const actionID =1     
        const lastBlock = await ethers.provider.getBlock('latest')     
        
        const tokenID = BigNumber.from(1)
        const action = [  owner1.address, manager.address, expectedOutputAmount,    // Manger is the issuer address
                          tokenID.add(MASK_OFFSET), lastBlock.timestamp, true ]     // Offset action is claimed
        expect(await arkreenRetirement.getOffsetActions(actionID)).to.deep.equal(action)

        const offsetRecord = [owner1.address, owner1.address, "Owner1", "Tester", "Just Testing A", 
                              BigNumber.from(lastBlock.timestamp), expectedOutputAmount, [actionID]]
        const badgeID = 1                            
        expect(await arkreenRetirement.getCertificate(badgeID)).to.deep.equal(offsetRecord)   
      });    
  
      it("ActionOperatorNative: Exact ART Token", async () => {
        await mintAREC(5000)          // 2

        await arkreenRECToken.setClimateOperator(arkreenOperator.address)
  
        const tokenETHAmount = expandTo18Decimals(1000)
        const tokenArtAmount = expandTo9Decimals(1000000)
        await addLiquidityEEA(tokenETHAmount, tokenArtAmount, 0)      // should be 0 here

        const amountPay = expandTo18Decimals(20)
        const amountART = expandTo9Decimals(1000)
        const badgeInfo =  {
                  beneficiary:    owner1.address,
                  offsetEntityID: 'Owner1',
                  beneficiaryID:  'Tester',
                  offsetMessage:  "Just Testing B"
                }

        // Normal transaction   
        const expectedInputAmount  = amountART.mul(tokenETHAmount).add(tokenArtAmount.sub(amountART))  // to solve the round problem
                                      .div(tokenArtAmount.sub(amountART))  

        const balanceBefore = await ethers.provider.getBalance(owner1.address)                                      

        await expect(arkreenOperator.connect(owner1).actionOperatorBadgeNative(arkreenRECToken.address,
                            amountART, false, constants.MaxUint256, badgeInfo, {value: amountPay}))
                            .to.emit(WETH, 'Deposit')
                            .withArgs(arkreenOperator.address, amountPay)
                            .to.emit(WETH, 'Transfer')
                            .withArgs(arkreenOperator.address, pairEEArt.address, expectedInputAmount)
                            .to.emit(arkreenRECToken, 'Transfer')
                            .withArgs(pairEEArt.address, arkreenOperator.address, amountART)
                            .to.emit(pairEEArt, 'Sync')
                            .withArgs(tokenETHAmount.add(expectedInputAmount), tokenArtAmount.sub(amountART))
                            .to.emit(pairEEArt, 'Swap')
                            .withArgs(router.address, expectedInputAmount, 0, amountART, arkreenOperator.address)  
                            .to.emit(arkreenRetirement, "OffsetCertificateMinted")
                            .withArgs(1)           
                            .to.emit(arkreenRetirement, "Locked")
                            .withArgs(1)     
                            .to.emit(WETH, 'Withdrawal')
                            .withArgs(arkreenOperator.address, amountPay.sub(expectedInputAmount))                                                         

        const actionID =1     
        const lastBlock = await ethers.provider.getBlock('latest')
        
        const tokenID = BigNumber.from(1)
        const action = [  owner1.address, manager.address, amountART,    // Manger is the issuer address
                          tokenID.add(MASK_OFFSET), lastBlock.timestamp, true ]     // Offset action is claimed
        expect(await arkreenRetirement.getOffsetActions(actionID)).to.deep.equal(action)

        const offsetRecord = [owner1.address, owner1.address, "Owner1", "Tester", "Just Testing B", 
                              BigNumber.from(lastBlock.timestamp), amountART, [actionID]]
        const badgeID = 1                            
        expect(await arkreenRetirement.getCertificate(badgeID)).to.deep.equal(offsetRecord)   

        const balanceAfter = await ethers.provider.getBalance(owner1.address)  
        expect(balanceAfter).to.gt(balanceBefore.sub(amountPay))                // Pay back
        expect(balanceAfter).to.lt(balanceBefore.sub(expectedInputAmount))      // Some gas fee

      });      

      it("ActionOperator: Exact Payment Token", async () => {
        await mintAREC(5000)          // 2

        await arkreenRECToken.setClimateOperator(arkreenOperator.address)
  
        const tokenTTAmount = expandTo18Decimals(10000)
        const tokenArtAmount = expandTo9Decimals(1000000)
        await addLiquidityTTA(tokenTTAmount, tokenArtAmount, 100)

        const amountPay = expandTo18Decimals(10)
        const amountART = expandTo9Decimals(0)
        const badgeInfo =  {
                  beneficiary:    owner1.address,
                  offsetEntityID: 'Owner1',
                  beneficiaryID:  'Tester',
                  offsetMessage:  "Just Testing"
                }

        // Normal transaction   
        const expectedOutputAmount  = amountPay.mul(tokenArtAmount).div(tokenTTAmount.add(amountPay))   

        await expect(arkreenOperator.connect(owner1).actionOperatorBadge( WETHPartner.address, arkreenRECToken.address,
                                              amountPay, amountART, true, constants.MaxUint256 , badgeInfo))   
                    .to.be.revertedWith("TransferHelper: TRANSFER_FROM_FAILED")     

        await WETHPartner.connect(owner1).approve(arkreenOperator.address, constants.MaxUint256)

        await expect(arkreenOperator.connect(owner1).actionOperatorBadge( WETHPartner.address, arkreenRECToken.address,
                            amountPay, amountART, true, constants.MaxUint256 , badgeInfo))
                            .to.emit(WETHPartner, 'Transfer')
                            .withArgs(owner1.address, arkreenOperator.address, amountPay)
                            .to.emit(WETHPartner, 'Transfer')
                            .withArgs(arkreenOperator.address, pairTTArt.address, amountPay)
                            .to.emit(arkreenRECToken, 'Transfer')
                            .withArgs(pairTTArt.address, arkreenOperator.address, expectedOutputAmount)
                            .to.emit(pairTTArt, 'Sync')
                            .withArgs(tokenTTAmount.add(amountPay), tokenArtAmount.sub(expectedOutputAmount))
                            .to.emit(pairTTArt, 'Swap')
                            .withArgs(router.address, amountPay, 0, expectedOutputAmount, arkreenOperator.address)  
                            .to.emit(arkreenRetirement, "OffsetCertificateMinted")
                            .withArgs(1)           
                            .to.emit(arkreenRetirement, "Locked")
                            .withArgs(1)      


        const actionID =1     
        const lastBlock = await ethers.provider.getBlock('latest')     
        
        const tokenID = BigNumber.from(1)
        const action = [  owner1.address, manager.address, expectedOutputAmount,    // Manger is the issuer address
                          tokenID.add(MASK_OFFSET), lastBlock.timestamp, true ]     // Offset action is claimed
        expect(await arkreenRetirement.getOffsetActions(actionID)).to.deep.equal(action)

        const offsetRecord = [owner1.address, owner1.address, "Owner1", "Tester", "Just Testing", 
                              BigNumber.from(lastBlock.timestamp), expectedOutputAmount, [actionID]]
        const badgeID = 1                            
        expect(await arkreenRetirement.getCertificate(badgeID)).to.deep.equal(offsetRecord)   
      });      

      it("ActionOperator: Exact ART Token", async () => {
        await mintAREC(5000)          // 2

        await arkreenRECToken.setClimateOperator(arkreenOperator.address)
  
        const tokenTTAmount = expandTo18Decimals(10000)
        const tokenArtAmount = expandTo9Decimals(1000000)
        await addLiquidityTTA(tokenTTAmount, tokenArtAmount, 100)

        const amountPay = expandTo18Decimals(20)
        const amountART = expandTo9Decimals(1000)
        const badgeInfo =  {
                  beneficiary:    owner1.address,
                  offsetEntityID: 'Owner1',
                  beneficiaryID:  'Tester',
                  offsetMessage:  "Just Testing"
                }

        // Normal transaction   
        const expectedInputAmount  = amountART.mul(tokenTTAmount).add(tokenArtAmount.sub(amountART))  // to solve the round problem
                                      .div(tokenArtAmount.sub(amountART))  

        await expect(arkreenOperator.connect(owner1).actionOperatorBadge( WETHPartner.address, arkreenRECToken.address,
                                        amountPay, amountART, true, constants.MaxUint256 , badgeInfo))   
              .to.be.revertedWith("TransferHelper: TRANSFER_FROM_FAILED")     

        await WETHPartner.connect(owner1).approve(arkreenOperator.address, constants.MaxUint256)
        await expect(arkreenOperator.connect(owner1).actionOperatorBadge( WETHPartner.address, arkreenRECToken.address,
                            amountPay, amountART, false, constants.MaxUint256, badgeInfo))
                            .to.emit(WETHPartner, 'Transfer')
                            .withArgs(owner1.address, arkreenOperator.address, amountPay)
                            .to.emit(WETHPartner, 'Transfer')
                            .withArgs(arkreenOperator.address, pairTTArt.address, expectedInputAmount)
                            .to.emit(arkreenRECToken, 'Transfer')
                            .withArgs(pairTTArt.address, arkreenOperator.address, amountART)
                            .to.emit(pairTTArt, 'Sync')
                            .withArgs(tokenTTAmount.add(expectedInputAmount), tokenArtAmount.sub(amountART))
                            .to.emit(pairTTArt, 'Swap')
                            .withArgs(router.address, expectedInputAmount, 0, amountART, arkreenOperator.address)  
                            .to.emit(arkreenRetirement, "OffsetCertificateMinted")
                            .withArgs(1)           
                            .to.emit(arkreenRetirement, "Locked")
                            .withArgs(1)
                            .to.emit(WETHPartner, 'Transfer')
                            .withArgs(arkreenOperator.address, owner1.address, amountPay.sub(expectedInputAmount))      

        const actionID =1     
        const lastBlock = await ethers.provider.getBlock('latest')     
        
        const tokenID = BigNumber.from(1)
        const action = [  owner1.address, manager.address, amountART,    // Manger is the issuer address
                          tokenID.add(MASK_OFFSET), lastBlock.timestamp, true ]     // Offset action is claimed
        expect(await arkreenRetirement.getOffsetActions(actionID)).to.deep.equal(action)

        const offsetRecord = [owner1.address, owner1.address, "Owner1", "Tester", "Just Testing", 
                              BigNumber.from(lastBlock.timestamp), amountART, [actionID]]
        const badgeID = 1                            
        expect(await arkreenRetirement.getCertificate(badgeID)).to.deep.equal(offsetRecord)   
      });      

      it("ActionOperatorWithPermit: Abnormal and Exact Payment Token", async () => {
        await mintAREC(5000)          // 2

        await arkreenRECToken.setClimateOperator(arkreenOperator.address)
  
        const tokenTTAmount = expandTo18Decimals(10000)
        const tokenArtAmount = expandTo9Decimals(1000000)
        await addLiquidityTTA(tokenTTAmount, tokenArtAmount, 100)

        const amountPay = expandTo18Decimals(10)
        const amountART = expandTo9Decimals(0)
        const badgeInfo =  {
                  beneficiary:    owner1.address,
                  offsetEntityID: 'Owner1',
                  beneficiaryID:  'Tester',
                  offsetMessage:  "Just Testing"
                }

        const nonce1 = await WETHPartner.nonces(owner1.address)
        const digest1 = await getApprovalDigest( WETHPartner,
                                { owner: owner1.address, spender: arkreenOperator.address, value: amountPay },
                                nonce1,
                                constants.MaxUint256
                              )
        const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
        const permitToPay: SignatureStruct = { v, r, s, token: WETHPartner.address, value:amountPay, deadline: constants.MaxUint256 } 

        // Abnormal Test
        // Check value consistence
        await expect(arkreenOperator.connect(owner1).actionOperatorBadgeWithPermit( WETHPartner.address, arkreenRECToken.address,
                            amountPay.sub(expandTo18Decimals(1)), amountART, true, badgeInfo, permitToPay ))
                  .to.be.revertedWith("ACT: Wrong payment value")     

        // Check signature
        permitToPay.deadline = constants.MaxUint256.sub(1)
        await expect(arkreenOperator.connect(owner1).actionOperatorBadgeWithPermit( WETHPartner.address, arkreenRECToken.address,
                            amountPay, amountART, true, badgeInfo, permitToPay ))
                  .to.be.revertedWith("FeSwap: INVALID_SIGNATURE")  


        // Normal transaction   
        permitToPay.deadline = constants.MaxUint256   
        const expectedOutputAmount  = amountPay.mul(tokenArtAmount).div(tokenTTAmount.add(amountPay))    
        await expect(arkreenOperator.connect(owner1).actionOperatorBadgeWithPermit( WETHPartner.address, arkreenRECToken.address,
                            amountPay, amountART, true, badgeInfo, permitToPay))
                            .to.emit(WETHPartner, 'Transfer')
                            .withArgs(owner1.address, arkreenOperator.address, amountPay)
                            .to.emit(WETHPartner, 'Transfer')
                            .withArgs(arkreenOperator.address, pairTTArt.address, amountPay)
                            .to.emit(arkreenRECToken, 'Transfer')
                            .withArgs(pairTTArt.address, arkreenOperator.address, expectedOutputAmount)
                            .to.emit(pairTTArt, 'Sync')
                            .withArgs(tokenTTAmount.add(amountPay), tokenArtAmount.sub(expectedOutputAmount))
                            .to.emit(pairTTArt, 'Swap')
                            .withArgs(router.address, amountPay, 0, expectedOutputAmount, arkreenOperator.address)  
                            .to.emit(arkreenRetirement, "OffsetCertificateMinted")
                            .withArgs(1)           
                            .to.emit(arkreenRetirement, "Locked")
                            .withArgs(1)      

        const actionID =1     
        const lastBlock = await ethers.provider.getBlock('latest')     
        
        const tokenID = BigNumber.from(1)
        const action = [  owner1.address, manager.address, expectedOutputAmount,    // Manger is the issuer address
                          tokenID.add(MASK_OFFSET), lastBlock.timestamp, true ]     // Offset action is claimed
        expect(await arkreenRetirement.getOffsetActions(actionID)).to.deep.equal(action)

        const offsetRecord = [owner1.address, owner1.address, "Owner1", "Tester", "Just Testing", 
                              BigNumber.from(lastBlock.timestamp), expectedOutputAmount, [actionID]]
        const badgeID = 1                            
        expect(await arkreenRetirement.getCertificate(badgeID)).to.deep.equal(offsetRecord)   
      });      


      it("ActionOperatorWithPermit: Exact ART Token", async () => {
        await mintAREC(5000)          // 2

        await arkreenRECToken.setClimateOperator(arkreenOperator.address)
  
        const tokenTTAmount = expandTo18Decimals(10000)
        const tokenArtAmount = expandTo9Decimals(1000000)
        await addLiquidityTTA(tokenTTAmount, tokenArtAmount, 100)

        const amountPay = expandTo18Decimals(20)
        const amountART = expandTo9Decimals(1000)
        const badgeInfo =  {
                  beneficiary:    owner1.address,
                  offsetEntityID: 'Owner1',
                  beneficiaryID:  'Tester',
                  offsetMessage:  "Just Testing"
                }

        const nonce1 = await WETHPartner.nonces(owner1.address)
        const digest1 = await getApprovalDigest( WETHPartner,
                                { owner: owner1.address, spender: arkreenOperator.address, value: amountPay },
                                nonce1,
                                constants.MaxUint256
                              )
        const { v,r,s } = ecsign(Buffer.from(digest1.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))
        const permitToPay: SignatureStruct = { v, r, s, token: WETHPartner.address, value:amountPay, deadline: constants.MaxUint256 } 

        // Abnormal Test
        // Check value consistence
        await expect(arkreenOperator.connect(owner1).actionOperatorBadgeWithPermit( WETHPartner.address, arkreenRECToken.address,
                            amountPay.sub(expandTo18Decimals(1)), amountART, false, badgeInfo, permitToPay ))
                  .to.be.revertedWith("ACT: Wrong payment value")     

        // Check signature
        permitToPay.deadline = constants.MaxUint256.sub(1)
        await expect(arkreenOperator.connect(owner1).actionOperatorBadgeWithPermit( WETHPartner.address, arkreenRECToken.address,
                            amountPay, amountART, false, badgeInfo, permitToPay ))
                  .to.be.revertedWith("FeSwap: INVALID_SIGNATURE")  


        // Normal transaction   
        permitToPay.deadline = constants.MaxUint256   
        const expectedInputAmount  = amountART.mul(tokenTTAmount).add(tokenArtAmount.sub(amountART))  // to solve the round problem
                                      .div(tokenArtAmount.sub(amountART))  
        await expect(arkreenOperator.connect(owner1).actionOperatorBadgeWithPermit( WETHPartner.address, arkreenRECToken.address,
                            amountPay, amountART, false, badgeInfo, permitToPay))
                            .to.emit(WETHPartner, 'Transfer')
                            .withArgs(owner1.address, arkreenOperator.address, amountPay)
                            .to.emit(WETHPartner, 'Transfer')
                            .withArgs(arkreenOperator.address, pairTTArt.address, expectedInputAmount)
                            .to.emit(arkreenRECToken, 'Transfer')
                            .withArgs(pairTTArt.address, arkreenOperator.address, amountART)
                            .to.emit(pairTTArt, 'Sync')
                            .withArgs(tokenTTAmount.add(expectedInputAmount), tokenArtAmount.sub(amountART))
                            .to.emit(pairTTArt, 'Swap')
                            .withArgs(router.address, expectedInputAmount, 0, amountART, arkreenOperator.address)  
                            .to.emit(arkreenRetirement, "OffsetCertificateMinted")
                            .withArgs(1)           
                            .to.emit(arkreenRetirement, "Locked")
                            .withArgs(1)
                            .to.emit(WETHPartner, 'Transfer')
                            .withArgs(arkreenOperator.address, owner1.address, amountPay.sub(expectedInputAmount))      

        const actionID =1     
        const lastBlock = await ethers.provider.getBlock('latest')     
        
        const tokenID = BigNumber.from(1)
        const action = [  owner1.address, manager.address, amountART,    // Manger is the issuer address
                          tokenID.add(MASK_OFFSET), lastBlock.timestamp, true ]     // Offset action is claimed
        expect(await arkreenRetirement.getOffsetActions(actionID)).to.deep.equal(action)

        const offsetRecord = [owner1.address, owner1.address, "Owner1", "Tester", "Just Testing", 
                              BigNumber.from(lastBlock.timestamp), amountART, [actionID]]
        const badgeID = 1                            
        expect(await arkreenRetirement.getCertificate(badgeID)).to.deep.equal(offsetRecord)   
      });      

      it("Offset Details: Normal check", async () => {
        await mintAREC(5000)          // 22

        const balance_1 = await arkreenRECToken.balanceOf(owner1.address)
        await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(500))
  
        await expect(arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(1500)))
                .to.emit(arkreenRECToken, "OffsetFinished")
                .withArgs(owner1.address, expandTo18Decimals(1500), 2) 
  
        const balance_2 = await arkreenRECToken.balanceOf(owner1.address)
        expect(balance_2).to.equal(balance_1.sub(expandTo18Decimals(2000)))
  
        expect(await arkreenRECToken.latestARECID()).to.equal(tokenID)      // tokenID is global 
  
        expect(await arkreenRECIssuance.balanceOf(arkreenRetirement.address)).to.equal(2)
        expect(await arkreenRetirement.detailsCounter()).to.equal(1)
  
        const detail_0 = [1, expandTo18Decimals(500)]
        const detail_1 = [2, expandTo18Decimals(1000)]
  
        expect(await arkreenRetirement.OffsetDetails(1,0)).to.deep.equal(detail_0)
        expect(await arkreenRetirement.OffsetDetails(1,1)).to.deep.equal(detail_1)
  
        await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(1500))
        await arkreenRECToken.connect(owner1).commitOffset(expandTo18Decimals(2500))
      });            
    })  
});
