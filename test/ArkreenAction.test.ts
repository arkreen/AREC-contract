import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { constants, BigNumber, Contract, utils } from 'ethers'

import { ethers, network, upgrades } from "hardhat";
//import { waffle } from "hardhat"

import {
    ArkreenTokenTest,
    ArkreenMiner,
    ArkreenRECIssuance,
    ArkreenRegistry,
    ArkreenRECToken,
    ArkreenBadge,
} from "../typechain";

import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { getApprovalDigest, expandTo18Decimals, randomAddresses, RECStatus, MinerType, BigNumberPercent } from "./utils/utilities";
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { RECRequestStruct, SignatureStruct, RECDataStruct } from "../typechain/contracts/ArkreenRECIssuance";
import { OffsetActionStruct }  from "../typechain/contracts/ArkreenBadge";
import FeSwapPair from '../artifacts/contracts/Dex/FeSwapPair.sol/FeSwapPair.json'

//const { provider, createFixtureLoader } = waffle;

const MASK_OFFSET = BigNumber.from('0x8000000000000000')
const MASK_DETAILS = BigNumber.from('0xC000000000000000')
const initPoolPrice = expandTo18Decimals(1).div(5)
const BidStartTime: number = 1676822400   // 2023/02/20 00/00/00
const OPEN_BID_DURATION: number =  (3600 * 24 * 14)
const rateTriggerArbitrage: number = 10

const overrides = {
  gasLimit: 30000000
}

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
      const WETHPartner = await ERC20Factory.deploy(expandTo18Decimals(10000),"WETH Partner");
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
  
      await AKREToken.transfer(owner1.address, expandTo18Decimals(10000))
      await AKREToken.connect(owner1).approve(arkreenRECIssuance.address, expandTo18Decimals(10000))
      await AKREToken.transfer(maker1.address, expandTo18Decimals(10000))
      await AKREToken.connect(maker1).approve(arkreenRECIssuance.address, expandTo18Decimals(10000))
      await AKREToken.connect(owner1).approve(arkreenMiner.address, expandTo18Decimals(10000))
      await AKREToken.connect(maker1).approve(arkreenMiner.address, expandTo18Decimals(10000))

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

      return {  tokenA,
        tokenB,
        WETH,
        WETHPartner,
        factoryFeswa,
        routerFeswa,
        routerEventEmitter,
        pairAAB,
        pairABB,
        WETHPairTTE,
        WETHPairTEE,
        Feswa,
        FeswaNFT,
        tokenIDMatch,
        MetamorphicFactory,
        AKREToken, arkreenMiner, arkreenRegistry, arkreenRECIssuance, arkreenRECToken, arkreenRetirement}
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


    describe( "FeSwap Swap Test", () => {
      async function addLiquidity(tokenAAmount: BigNumber, tokenBAmount: BigNumber, ratio: Number) {
        await tokenA.approve(router.address, constants.MaxUint256)
        await tokenB.approve(router.address, constants.MaxUint256)
        await router.addLiquidity(
            {
              tokenA:         tokenA.address,
              tokenB:         tokenB.address,
              amountADesired: tokenAAmount,
              amountBDesired: tokenBAmount,
              amountAMin:     0,
              amountBMin:     0,
              ratio:          ratio,
            },
            wallet.address,
            constants.MaxUint256,
            overrides
          )
      }
          
      describe('swapExactTokensForTokens', async() => {
        const tokenAAmount = expandTo18Decimals(5)
        const tokenBAmount = expandTo18Decimals(10)
        const swapAmount = expandTo18Decimals(1)
        const expectedOutputAmount = BigNumber.from('1666666666666666666')

        beforeEach(async () => {
          await addLiquidity(tokenAAmount, tokenBAmount, 100)
        })

        afterEach(async () => {
          const reserves = await pairAAB.getReserves()
          expect(await tokenA.balanceOf(pairAAB.address)).to.eq(reserves[0])
          expect(await tokenB.balanceOf(pairAAB.address)).to.eq(reserves[1]) 
        })
        
        it('happy path', async () => {
          await expect(
            router.swapExactTokensForTokens(
              swapAmount,
              0,
              [tokenA.address, tokenB.address],
              wallet.address,
              constants.MaxUint256,
              overrides
            )
         )
            .to.emit(tokenA, 'Transfer')
            .withArgs(wallet.address, pairAAB.address, swapAmount)
            .to.emit(tokenB, 'Transfer')
            .withArgs(pairAAB.address, wallet.address, expectedOutputAmount)
            .to.emit(pairAAB, 'Sync')
            .withArgs(tokenAAmount.add(swapAmount), tokenBAmount.sub(expectedOutputAmount))
            .to.emit(pairAAB, 'Swap')
            .withArgs(router.address, swapAmount, 0, expectedOutputAmount, wallet.address)
        })

        it('Abnormal Checking & Amounts Checking', async () => {
          await tokenA.approve(routerEventEmitter.address, constants.MaxUint256)

          await expect( router.swapExactTokensForTokens(  swapAmount, expectedOutputAmount.add(1), 
                                                          [tokenA.address, tokenB.address],
                                                          wallet.address, constants.MaxUint256, overrides ))
                  .to.be.revertedWith('FeSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT')

          await expect(
            routerEventEmitter.swapExactTokensForTokens(
              router.address,
              swapAmount,
              0,
              [tokenA.address, tokenB.address],
              wallet.address,
              constants.MaxUint256,
              overrides
            )
          )
            .to.emit(routerEventEmitter, 'Amounts')
            .withArgs([swapAmount, expectedOutputAmount])
        })

        it('gas', async () => {
          // ensure that setting price{0,1}CumulativeLast for the first time doesn't affect our gas math
//        await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
          await time.increaseTo((await ethers.provider.getBlock('latest')).timestamp + 1)
          await pairAAB.sync(overrides)

          await tokenA.approve(router.address, constants.MaxUint256)
//        await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1)
          await time.increaseTo((await ethers.provider.getBlock('latest')).timestamp + 1)
          const tx = await router.swapExactTokensForTokens(
            swapAmount,
            0,
            [tokenA.address, tokenB.address],
            wallet.address,
            constants.MaxUint256,
            overrides
          )
          const receipt = await tx.wait()
          expect(receipt.gasUsed).to.eq("94732")     // 92626 93268  92279 92330 92352 92373 105372 105560 106207 106174 106223 104547 192574 // 110796
        })
        
      })

      describe('swapTokensForExactTokens', () => {
        const tokenAAmount = expandTo18Decimals(5)
        const tokenBAmount = expandTo18Decimals(10)
        const outputAmount = expandTo18Decimals(1)
        const expectedSwapAmount = outputAmount.mul(tokenAAmount.div(2)).add(expandTo18Decimals(4)).div(expandTo18Decimals(4))
        expect(expectedSwapAmount).to.eq(BigNumber.from('625000000000000001'))      // (Half pool)

        beforeEach(async () => {
          await addLiquidity(tokenAAmount, tokenBAmount, 50)
        })

        it('happy path', async () => {
          await tokenA.approve(router.address, constants.MaxUint256)
          await expect(
            router.swapTokensForExactTokens(
              outputAmount,
              constants.MaxUint256,
              [tokenA.address, tokenB.address],
              wallet.address,
              constants.MaxUint256,
              overrides
            )
          )
            .to.emit(tokenA, 'Transfer')
            .withArgs(wallet.address, pairAAB.address, expectedSwapAmount)
            .to.emit(tokenB, 'Transfer')
            .withArgs(pairAAB.address, wallet.address, outputAmount)
            .to.emit(pairAAB, 'Sync')
            .withArgs(BigNumberPercent(tokenAAmount,50).add(expectedSwapAmount), BigNumberPercent(tokenBAmount,50).sub(outputAmount))
            .to.emit(pairAAB, 'Swap')
            .withArgs(router.address, expectedSwapAmount, 0,  outputAmount, wallet.address)
        })

        it('Abnormal Checking & Amounts Checking', async () => {
          await tokenA.approve(routerEventEmitter.address, constants.MaxUint256)

          await expect( router.swapTokensForExactTokens(  outputAmount, expectedSwapAmount.sub(1), 
                                                          [tokenA.address, tokenB.address],
                                                          wallet.address, constants.MaxUint256, overrides ))
                  .to.be.revertedWith('FeSwapRouter: EXCESSIVE_INPUT_AMOUNT')

          await expect(
            routerEventEmitter.swapTokensForExactTokens(
              router.address,
              outputAmount,
              constants.MaxUint256,
              [tokenA.address, tokenB.address],
              wallet.address,
              constants.MaxUint256,
              overrides
            )
          )
            .to.emit(routerEventEmitter, 'Amounts')
            .withArgs([expectedSwapAmount, outputAmount])
        })

        it('gas', async () => {
          await tokenA.approve(router.address, constants.MaxUint256)
          const tx = await router.swapTokensForExactTokens(
              outputAmount,
              constants.MaxUint256,
              [tokenA.address, tokenB.address],
              wallet.address,
              constants.MaxUint256,
              overrides
            )
          const receipt = await tx.wait()
          expect(receipt.gasUsed).to.eq("95686")     // 93847 92858 92909  92931 92952 135951 136095 136786 136775 136811 135091 192574 // 110796
        })

      })
    })

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
