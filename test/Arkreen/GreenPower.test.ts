import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
const {ethers, upgrades} =  require("hardhat");
import hre from 'hardhat'
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
import { getGreenPowerStakingDigest, getApprovalDigest, expandTo18Decimals, randomAddresses, expandTo9Decimals } from '../utils/utilities'
import { getGreenPowerUnstakingDigest, ActionInfo } from '../utils/utilities'

import { constants, BigNumber, } from 'ethers'
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

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
    GreenPower,
    ArkreenToken__factory,
    ArkreenTokenTest__factory
    // ArkreenTokenV2,
    // ArkreenTokenV2__factory
} from "../../typechain";

import { RECRequestStruct, SignatureStruct, RECDataStruct } from "../../typechain/contracts/ArkreenRECIssuance";
import Decimal from "decimal.js";
import { deploy } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { any } from "hardhat/internal/core/params/argumentTypes";
const constants_MaxDealine = BigNumber.from('0xFFFFFFFF')

describe("GreenPower Test Campaign", ()=>{

    let deployer: SignerWithAddress;
    let manager: SignerWithAddress;
    let register_authority: SignerWithAddress;
    let fund_receiver: SignerWithAddress;

    let owner1: SignerWithAddress;
    let maker1: SignerWithAddress;
    let user1:  SignerWithAddress
    let user2:  SignerWithAddress
    let user3:  SignerWithAddress

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
    let greenPower:                   GreenPower

    const value10000 = BigNumber.from(10000).mul(256).add(18)     // 10000 AKRE
    const value1000 = BigNumber.from(1000).mul(256).add(18)       // 10000 AKRE
    const value100 = BigNumber.from(100).mul(256).add(18)         // 10000 AKRE

    const value50000 = BigNumber.from(50000).mul(256).add(18)     // 50000 AKRE
    const value5000 = BigNumber.from(5000).mul(256).add(18)       // 5000 AKRE
    const value500 = BigNumber.from(500).mul(256).add(18)         // 500 AKRE

    const Bytes32_Zero = "0x0000000000000000000000000000000000000000000000000000000000000000"

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
        const Miner_Manager = 0 
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

        const GreenPowerFactory = await ethers.getContractFactory("GreenPower")
        const greenPower = await upgrades.deployProxy(GreenPowerFactory, [AKREToken.address, kWhToken.address, manager.address]) as GreenPower
        await greenPower.deployed()

        await greenPower.approveConvertkWh([tokenA.address, WETH.address])
       
        return { AKREToken, arkreenMiner, arkreenRegistry, arkreenRECIssuance, arkreenRECToken, 
          arkreenRetirement, arkreenRECIssuanceExt, arkreenRECBank, kWhToken, WETH, tokenA,
          greenPower }
    }

    describe('GreenPower test', () => {

      beforeEach(async () => {

        [deployer, manager, register_authority, fund_receiver, owner1, user1, user2, user3, maker1] = await ethers.getSigners();

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
        greenPower = fixture.greenPower

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

        await AKREToken.connect(user1).approve(greenPower.address, constants.MaxUint256)
        await AKREToken.connect(user2).approve(greenPower.address, constants.MaxUint256)
        await AKREToken.connect(user3).approve(greenPower.address, constants.MaxUint256)

      });

      async function walletStake(wallet: SignerWithAddress, amount: BigNumber) {
        const {nonce}  = await greenPower.getStakerInfo(wallet.address)

        const txid = randomAddresses(1)[0]

        let plugMiner =""
        if(wallet == user1) plugMiner = "0x280a7c4E032584F97E84eDd396a00799da8D061A"
        if(wallet == user2) plugMiner = "0x762d865e237e04e88e30333ae86315882a0b3745"
        if(wallet == user3) plugMiner = "0xfbc44c2c777e73efd6ac4abd2ce6b83779163b6c"

        const period = BigNumber.from(60 * 3600 * 24)
  
        const digest = getGreenPowerStakingDigest(
            'Green Power',
            greenPower.address,
            { txid, staker: wallet.address, plugMiner: plugMiner, amount: amount, period: period, nonce: nonce},
            constants.MaxUint256
          )

        const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))   
        const signature: GreenPower.SigStruct = { v, r, s }  

        await greenPower.connect(wallet).stake(txid, plugMiner, amount, period, nonce, constants.MaxUint256, signature) 
      }

      async function walletUnstake(wallet: SignerWithAddress, amount: BigNumber) {
        const {nonce}  = await greenPower.getStakerInfo(wallet.address)
        const txid = randomAddresses(1)[0]
        const plugMiner = "0x280a7c4E032584F97E84eDd396a00799da8D061A"
  
        const digest = getGreenPowerUnstakingDigest(
            'Green Power',
            greenPower.address,
            {txid, staker: wallet.address, plugMiner: plugMiner, amount: amount, nonce: nonce},
            constants.MaxUint256
          )

        const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))   
        const signature: GreenPower.SigStruct = { v, r, s }  

        await greenPower.connect(wallet).unstake(txid, plugMiner, amount, nonce, constants.MaxUint256, signature) 
      }
      
      it("GreenPower Deposit test", async function () {
        await expect(greenPower.deposit(tokenA.address, expandTo18Decimals(12345)))
                  .to.be.revertedWith("TransferHelper: TRANSFER_FROM_FAILED")

        await expect(greenPower.deposit(tokenA.address, 0))
                  .to.be.revertedWith("Zero Amount")

        const balanceBefore = await tokenA.balanceOf(deployer.address)

        await tokenA.approve(greenPower.address, constants.MaxUint256)
        await expect(greenPower.deposit(tokenA.address, expandTo18Decimals(12345)))
                  .to.emit(greenPower, 'Deposit')
                  .withArgs(deployer.address, tokenA.address, expandTo18Decimals(12345))

        expect(await greenPower.depositAmounts(deployer.address, tokenA.address)).to.eq(expandTo18Decimals(12345))

        await greenPower.deposit(tokenA.address, expandTo18Decimals(23456))
        expect(await greenPower.depositAmounts(deployer.address, tokenA.address)).to.eq(expandTo18Decimals(12345 + 23456))

        expect(await tokenA.balanceOf(deployer.address)).to.eq(balanceBefore.sub(expandTo18Decimals(12345 + 23456)))
      });

      it("GreenPower Withdraw test", async function () {
        await tokenA.approve(greenPower.address, constants.MaxUint256)
        await greenPower.deposit(tokenA.address, expandTo18Decimals(56789))

        await expect(greenPower.withdraw(tokenA.address, 0))
                  .to.be.revertedWith("Zero Amount")

        const balanceBefore = await tokenA.balanceOf(deployer.address)

        await expect(greenPower.withdraw(tokenA.address, expandTo18Decimals(23456)))
                  .to.emit(greenPower, 'Withdraw')
                  .withArgs(deployer.address, tokenA.address, expandTo18Decimals(23456))
        await greenPower.withdraw(tokenA.address, expandTo18Decimals(12345))                

        expect(await greenPower.depositAmounts(deployer.address, tokenA.address)).to.eq(expandTo18Decimals(56789 - 23456 - 12345))
        expect(await tokenA.balanceOf(deployer.address)).to.eq(balanceBefore.add(expandTo18Decimals(23456 + 12345)))
      });

      it("GreenPower stake Test", async function () {
        // Normal
        await AKREToken.transfer(user1.address, expandTo18Decimals(100_000_000))
        await AKREToken.transfer(user2.address, expandTo18Decimals(100_000_000))
        await AKREToken.transfer(user3.address, expandTo18Decimals(100_000_000))

        await walletStake(user1, expandTo18Decimals(23456))

        const {nonce}  = await greenPower.getStakerInfo(user1.address)

        const txid = randomAddresses(1)[0]
        const amount = expandTo18Decimals(12345)
        const plugMiner = "0x280a7c4E032584F97E84eDd396a00799da8D061A"
        const period = BigNumber.from(60 * 3600 * 24)
  
        const digest = getGreenPowerStakingDigest(
            'Green Power',
            greenPower.address,
            { txid, staker: user1.address, plugMiner, amount, period, nonce},
            constants.MaxUint256
          )

        const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))   
        const signature: GreenPower.SigStruct = { v, r, s }  

        const totalStake = await greenPower.totalStake()
        const balanceBefore = await AKREToken.balanceOf(greenPower.address)
        const {stakeAmount: stakeAmountA, offsetAmount: offsetAmountA, nonce: nonceA, releaseTime: releaseTimeA} 
                              = await greenPower.getStakerInfo(user1.address)

        await expect(greenPower.connect(user1).stake(txid, plugMiner, amount, period, nonce, constants.MaxUint256, signature))
                      .to.emit(greenPower, 'Stake')
                      .withArgs(txid, user1.address, plugMiner, amount, period, nonce)

        // Check totalStake
        expect(await greenPower.totalStake()).to.eq(totalStake.add(expandTo18Decimals(12345)))

        const {stakeAmount: stakeAmountB, offsetAmount: offsetAmountB, nonce: nonceB, releaseTime: releaseTimeB} 
                              = await greenPower.getStakerInfo(user1.address)

        // check stakerInfo
        const lastBlockN = await ethers.provider.getBlock('latest')
        expect(stakeAmountB).to.eq(stakeAmountA.add(expandTo18Decimals(12345)))
        expect(offsetAmountB).to.eq(0)        
        expect(nonceB).to.eq(nonce.add(1))
        expect(releaseTimeB).to.eq(lastBlockN.timestamp + 60 * 3600 * 24)

        // check akre balance
        expect(await AKREToken.balanceOf(greenPower.address)).to.eq(balanceBefore.add(expandTo18Decimals(12345)))

        // check minerOffsetInfo
        expect(await greenPower.getMinerOffsetInfo(plugMiner)).to.deep.eq([user1.address, 0, 0])
        
        // Abnormal test
        await expect(greenPower.connect(user1).stake(txid, plugMiner, 0, period, nonce, constants.MaxUint256, signature))
                      .to.be.revertedWith("Zero Stake")

        await expect(greenPower.connect(user1).stake(txid, plugMiner, amount, period, nonce, constants.MaxUint256, signature))
                      .to.be.revertedWith("Nonce Not Match")

        await expect(greenPower.connect(user1).stake(txid, plugMiner, amount, period.add(2), nonce.add(1), constants.MaxUint256, signature))
                      .to.be.revertedWith("Wrong period")

        await expect(greenPower.connect(user1).stake(txid, plugMiner, amount, period.div(2), nonce.add(1), constants.MaxUint256, signature))
                      .to.be.revertedWith("Short Period")

        await expect(greenPower.connect(user1).stake(txid, plugMiner, amount, period, nonce.add(1), constants.MaxUint256, signature))
                      .to.be.revertedWith("Wrong Signature")

        await walletStake(user1, expandTo18Decimals(10000))                      
        await walletStake(user2, expandTo18Decimals(30000))
        await walletStake(user3, expandTo18Decimals(50000))
        await walletStake(user2, expandTo18Decimals(70000))
        await walletStake(user3, expandTo18Decimals(90000))
        await walletStake(user2, expandTo18Decimals(110000))
        await walletStake(user2, expandTo18Decimals(130000))
        await walletStake(user1, expandTo18Decimals(150000))
        await walletStake(user3, expandTo18Decimals(170000))

        const stakeInfo1 = [ expandTo18Decimals(23456 + 12345 + 10000 + 150000), 0, 4]
        const stakeInfo2 = [ expandTo18Decimals(30000 + 70000 + 110000 + 130000), 0 , 4]
        const stakeInfo3 = [ expandTo18Decimals(50000 + 90000 + 170000), 0, 3]

        expect((await greenPower.getStakerInfo(user1.address)).slice(0,3)) .to.deep.equal(stakeInfo1)
        expect((await greenPower.getStakerInfo(user2.address)).slice(0,3)).to.deep.equal(stakeInfo2)
        expect((await greenPower.getStakerInfo(user3.address)).slice(0,3)).to.deep.equal(stakeInfo3)
      });

      it("GreenPower Unstake Test", async function () {
        // Normal
        await AKREToken.transfer(user1.address, expandTo18Decimals(100_000_000))
        await AKREToken.transfer(user2.address, expandTo18Decimals(100_000_000))
        await AKREToken.transfer(user3.address, expandTo18Decimals(100_000_000))

        await walletStake(user1, expandTo18Decimals(23456))

        let {nonce} = await greenPower.getStakerInfo(user1.address)

        const txid = randomAddresses(1)[0]
        let amount = expandTo18Decimals(12345)
        const plugMiner = "0x280a7c4E032584F97E84eDd396a00799da8D061A"
  
        const digest = getGreenPowerUnstakingDigest(
            'Green Power',
            greenPower.address,
            { txid, staker: user1.address, plugMiner, amount, nonce},
            constants.MaxUint256
          )

        const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))   
        const signature: GreenPower.SigStruct = { v, r, s }  

        const totalStake = await greenPower.totalStake()
        const balanceBefore = await AKREToken.balanceOf(greenPower.address)
        const userBalanceBefore = await AKREToken.balanceOf(user1.address)
        const {stakeAmount: stakeAmountA, releaseTime: releaseTimeA} 
                              = await greenPower.getStakerInfo(user1.address)

        // increase time to unstake                              
        await ethers.provider.send("evm_increaseTime", [60 * 3600 * 24]);
        await mine(1)

        await expect(greenPower.connect(user1).unstake(txid, plugMiner, amount, nonce, constants.MaxUint256, signature))
                      .to.emit(greenPower, 'Unstake')
                      .withArgs(txid, user1.address, plugMiner, amount, nonce)

        // Check totalStake
        expect(await greenPower.totalStake()).to.eq(totalStake.sub(expandTo18Decimals(12345)))

        const {stakeAmount: stakeAmountB, offsetAmount: offsetAmountB, nonce: nonceB, releaseTime: releaseTimeB} 
                              = await greenPower.getStakerInfo(user1.address)

        // check stakerInfo
        expect(stakeAmountB).to.eq(stakeAmountA.sub(expandTo18Decimals(12345)))
        expect(offsetAmountB).to.eq(0)        
        expect(nonceB).to.eq(nonce.add(1))              // nonce + 1
        expect(releaseTimeB).to.eq(releaseTimeA)        // releas time is same 

        // check akre balance
        expect(await AKREToken.balanceOf(greenPower.address)).to.eq(balanceBefore.sub(expandTo18Decimals(12345)))
        expect(await AKREToken.balanceOf(user1.address)).to.eq(userBalanceBefore.add(expandTo18Decimals(12345)))

        // check minerOffsetInfo
        expect(await greenPower.getMinerOffsetInfo(plugMiner)).to.deep.eq([user1.address, 0, 0])
        
        // Abnormal test
        await walletStake(user1, expandTo18Decimals(12345))     // all stake = 23456
        nonce = nonce.add(2)

        await expect(greenPower.connect(user1).unstake(txid, plugMiner, 0, nonce, constants.MaxUint256, signature))
                      .to.be.revertedWith("Zero Stake")

        await expect(greenPower.connect(user1).unstake(txid, plugMiner, amount, nonce.add(1), constants.MaxUint256, signature))
                      .to.be.revertedWith("Nonce Not Match")

        amount = expandTo18Decimals(23456)
        await expect(greenPower.connect(user1).unstake(txid, plugMiner, amount.add(1), nonce, constants.MaxUint256, signature))
                      .to.be.revertedWith("Unstake Overflowed")

        await expect(greenPower.connect(user1).unstake(txid, plugMiner, amount, nonce, constants.MaxUint256, signature))
                      .to.be.revertedWith("Not Released")

        await ethers.provider.send("evm_increaseTime", [60 * 3600 * 24]);
        await mine(1)

        await expect(greenPower.connect(user1).unstake(txid, plugMiner, amount, nonce, constants.MaxUint256, signature))
                      .to.be.revertedWith("Wrong Signature")

      });

/*
      it("PlantUnstaking Test", async function () {
        // Prepare
        await walletStake(user1, expandTo18Decimals(10000))
        await walletStake(user2, expandTo18Decimals(30000))
        await walletStake(user3, expandTo18Decimals(50000))
        await walletStake(user2, expandTo18Decimals(70000))
        await walletStake(user3, expandTo18Decimals(90000))
        await walletStake(user2, expandTo18Decimals(110000))
        await walletStake(user2, expandTo18Decimals(130000))
        await walletStake(user1, expandTo18Decimals(150000))
        await walletStake(user3, expandTo18Decimals(170000))

        // Abnormal
        const amount= expandTo18Decimals(10000)
        const reward= expandTo18Decimals(1000)
        const {nonce}  = await plantStaking.stakeInfo(user1.address)
        const txid = BigNumber.from(4567)

        const cspminer = "0x280a7c4E032584F97E84eDd396a00799da8D061A"
  
        const digest = getPlantUnstakingDigest(
            'Plant Miner Staking',
            plantStaking.address,
            {txid, staker: user1.address, cspminer: cspminer, amount, reward, nonce},
            constants.MaxUint256
          )

        const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))   
        const signature: PlantStaking.SigStruct = { v, r, s }  

        await expect(plantStaking.connect(user1).unstakeWithReward(txid, cspminer, 0, 0, nonce, constants.MaxUint256, signature))
                      .to.be.revertedWith("Zero Stake")

        await expect(plantStaking.connect(user1).unstakeWithReward(txid, cspminer, amount, reward, nonce.add(1), constants.MaxUint256, signature))
                      .to.be.revertedWith("Nonce Not Match")

        await expect(plantStaking.connect(user1).unstakeWithReward(txid, cspminer, expandTo18Decimals(150000+10000).add(1), reward, nonce, constants.MaxUint256, signature))
                      .to.be.revertedWith("Unstake Overflowed")

        await expect(plantStaking.connect(user1).unstakeWithReward(txid, cspminer, amount.add(1), reward, nonce, constants.MaxUint256, signature))
                      .to.be.revertedWith("Wrong Signature")

        // reward is changed to be deposited beforehand, not be transferred from rewarder 
//       await expect(plantStaking.connect(user1).unstakeWithReward(txid, cspminer, amount, reward, nonce, constants.MaxUint256, signature))
//                      .to.be.revertedWith("ERC20: insufficient allowance")

        await arkreenToken.approve(plantStaking.address, constants.MaxUint256)

         // Event
         await expect(plantStaking.connect(user1).unstakeWithReward(txid, cspminer, amount, reward, nonce, constants.MaxUint256, signature))
//                      .to.emit(arkreenToken, 'Transfer')
//                      .withArgs(deployer.address, plantStaking.address, reward)    
                      .to.emit(arkreenToken, 'Transfer')
                      .withArgs(plantStaking.address, user1.address, amount.add(reward))    
                      .to.emit(plantStaking, 'Unstake')
                      .withArgs(txid, user1.address, cspminer, amount, reward)   

        const stakeInfo1A = await plantStaking.stakeInfo(user1.address)
        const stakeInfo2A = await plantStaking.stakeInfo(user2.address)
        const stakeInfo3A = await plantStaking.stakeInfo(user3.address)

        await walletUnstake(user1, expandTo18Decimals(10000), expandTo18Decimals(1000))
        await walletUnstake(user2, expandTo18Decimals(50000), expandTo18Decimals(5000))
        await walletUnstake(user3, expandTo18Decimals(70000), expandTo18Decimals(7000))

        await walletUnstake(user1, expandTo18Decimals(30000), expandTo18Decimals(3000))
        await walletUnstake(user2, expandTo18Decimals(70000), expandTo18Decimals(7000))
        await walletUnstake(user3, expandTo18Decimals(90000), expandTo18Decimals(9000))

        expect((await plantStaking.stakeInfo(user1.address)).amountStake).to.eq(stakeInfo1A.amountStake.sub(expandTo18Decimals(10000+30000)))
        expect((await plantStaking.stakeInfo(user2.address)).amountStake).to.eq(stakeInfo2A.amountStake.sub(expandTo18Decimals(50000+70000)))
        expect((await plantStaking.stakeInfo(user3.address)).amountStake).to.eq(stakeInfo3A.amountStake.sub(expandTo18Decimals(70000+90000)))

        expect((await plantStaking.stakeInfo(user1.address)).rewardStake).to.eq(expandTo18Decimals(1000+3000 + 1000))  // 1000 comes from the abnormal test
        expect((await plantStaking.stakeInfo(user2.address)).rewardStake).to.eq(expandTo18Decimals(5000+7000))
        expect((await plantStaking.stakeInfo(user3.address)).rewardStake).to.eq(expandTo18Decimals(7000+9000))

        expect(await plantStaking.totalStake()).to.equal(stakeInfo1A.amountStake
                                        .add(stakeInfo2A.amountStake).add(stakeInfo3A.amountStake)
                                        .sub(expandTo18Decimals(10000+30000+50000+70000+70000+90000)))

        expect(await plantStaking.totalReward()).to.equal(expandTo18Decimals(1000+3000+5000+7000+7000+9000 + 1000))

      });
*/

/*
      it("GreenPower makeGreenBox test", async function () {

        await AKREToken.transfer(greenBTC2.address, expandTo18Decimals(100000000))

        const domainID = 1
        await greenBTC2.registerDomain(domainID, domainInfoBigInt.toHexString())

        await kWhToken.connect(owner1).approve(greenBTC2.address, constants.MaxUint256)

        await expect(greenBTC2.connect(owner1).makeGreenBox(0x8002, 123))
                  .to.be.revertedWith("GBC2: Over Limit")

        await expect(greenBTC2.connect(owner1).makeGreenBox(1, 0x2000000))
                  .to.be.revertedWith("GBC2: Over Limit")

        await expect(greenBTC2.connect(owner1).makeGreenBox(10, 123))
                  .to.be.revertedWith("GBC2: Empty Domain")

        const balancekWh = await kWhToken.balanceOf(owner1.address)                  

        let greenizetx
        await expect(greenizetx = await  greenBTC2.connect(owner1).makeGreenBox(1,123))
                .to.emit(greenBTC2, 'DomainGreenized')
                .withArgs(owner1.address, 1, anyValue, 1, BigNumber.from(0), BigNumber.from(123))
                
        const receipt = await greenizetx.wait()
        console.log('makeGreenBox gas usage:', receipt.gasUsed )

        expect(await kWhToken.balanceOf(owner1.address)).to.eq(balancekWh.sub(expandTo9Decimals(123).div(10)))  

        await greenBTC2.connect(owner1).makeGreenBox(1,234)
        
        expect(await greenBTC2.userActionIDs(owner1.address)).to.eq("0x0000000100000002")
        expect(await greenBTC2.domainActionIDs(1)).to.eq("0x0000000100000002")

        const domainStatus = await greenBTC2.domainStatus(1)
        expect((BigNumber.from(domainStatus)).shr(224)).to.eq(BigNumber.from(123+234))

        expect(await kWhToken.balanceOf(owner1.address)).to.eq(balancekWh.sub(expandTo9Decimals(123+234).div(10)))
        
      });

      it("GreenPower openActionGifts + mintGifts test", async function () {

        // AKRE used for gift
        await AKREToken.approve(greenBTC2.address, constants.MaxUint256)
        await greenBTC2.depositFund(AKREToken.address, expandTo18Decimals(100000000))

        await greenBTC2.registerDomain(1, domainInfoBigInt.toHexString())
        await kWhToken.connect(owner1).approve(greenBTC2.address, constants.MaxUint256)

        const makeGreenBoxTx = await greenBTC2.connect(owner1).makeGreenBox(1,123)
        const receipt = await makeGreenBoxTx.wait()

        actionInfo.boxAmount = BigNumber.from(123)
        actionInfo.actor = owner1.address
        actionInfo.blockHeigh = BigNumber.from(receipt.blockNumber)
        actionInfo.blockHash = receipt.blockHash

        let allCounters = new Array<number>(8).fill(0)
        const  { counters: countersCheck, wonList: wonListCheck } = UtilCalculateGifts(actionInfo)

        for (let index=0; index<8; index++ ) {
          allCounters[index] += (index==0) ? countersCheck[index] :  countersCheck[index] - countersCheck[index-1]
        }

        const digest = getGreenBitcoinClaimGifts(
            'Green BTC Club',
            greenBTC2.address,
            1,
            receipt.blockNumber,
            receipt.blockHash
          )

        const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))  
        
        //await expect(greenBTC2.connect(owner1).openActionGifts(5, 0, receipt.blockHash, {v,r,s}))
        //                      .to.be.revertedWith("GBC2: Wrong Action ID")

        await expect(greenBTC2.connect(owner1).openActionGifts(1, receipt.blockNumber, receipt.blockHash, {v, r, s}))
                          .to.be.revertedWith("GBC2: Open Early")

        await mine(5)

        const {counters, wonList} = await greenBTC2.checkIfShot(owner1.address, 1, Bytes32_Zero)
        expect(counters).to.deep.eq(countersCheck)
        expect(wonList).to.deep.eq(wonListCheck)

        await expect(greenBTC2.connect(owner1).openActionGifts(1, receipt.blockNumber + 1, receipt.blockHash, {v,r,s}))
                            .to.be.revertedWith("GBC2: Wrong Block Height")

        const {v:v1, r:r1, s:s1} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyOwner.slice(2), 'hex'))  
        await expect(greenBTC2.connect(owner1).openActionGifts(1, receipt.blockNumber, receipt.blockHash, {v:v1, r:r1, s:s1}))
                            .to.be.revertedWith("Wrong Signature")

        let giftCounter = new Array<number>(8).fill(0)
        let counterBN = BigNumber.from(0)
        let giftTypeCounter = 0                            
        for(let index = 0; index < 8; index++) {
          giftCounter[index] = (index==0) ? countersCheck[index] : countersCheck[index] - countersCheck[index-1]
          counterBN = counterBN.shl(16).add(giftCounter[index])
          giftTypeCounter += ( giftCounter[index] == 0 ? 0 : 1)
        }       

        let giftIDs = new Array<BigNumber>(giftTypeCounter).fill(BigNumber.from(0))
        let amounts = new Array<BigNumber>(giftTypeCounter).fill(BigNumber.from(0))

        let offset = 0
        const giftType = [1, 2, 3, 0, 81, 82, 83, 0]
        let amountAKRE = BigNumber.from(0)
        let amountTokenA = BigNumber.from(0)
        for(let index = 0; index < 8; index++) {
          if(giftCounter[index] != 0) {
            giftIDs[offset] = BigNumber.from(giftType[index])
            amounts[offset] = BigNumber.from(giftCounter[index])
            if(giftType[index] == 1 ) amountAKRE = amountAKRE.add(amounts[offset].mul(expandTo18Decimals(10000)))
            if(giftType[index] == 2 ) amountAKRE = amountAKRE.add(amounts[offset].mul(expandTo18Decimals(1000)))
            if(giftType[index] == 3 ) amountAKRE = amountAKRE.add(amounts[offset].mul(expandTo18Decimals(100)))
            if(giftType[index] == 81 ) amountTokenA = amountTokenA.add(amounts[offset].mul(expandTo18Decimals(50000)))
            if(giftType[index] == 82) amountTokenA = amountTokenA.add(amounts[offset].mul(expandTo18Decimals(5000)))
            if(giftType[index] == 83) amountTokenA = amountTokenA.add(amounts[offset].mul(expandTo18Decimals(500)))
            offset++
          }
        }       
       
        const balanceAKREBefore = await AKREToken.balanceOf(greenBTCGift.address)
        const balanceTokeanABefore = await tokenA.balanceOf(greenBTCGift.address)

        let openActionGiftsTx
        await expect(openActionGiftsTx= await greenBTC2.connect(owner1).openActionGifts(1, receipt.blockNumber, receipt.blockHash, {v,r,s}))
                  .to.emit(greenBTCGift, 'GiftBatchMinted')
                  .withArgs(owner1.address, giftIDs, amounts)
                  .to.emit(greenBTC2, 'ActionGiftsOpened')
                  .withArgs(owner1.address, 1, receipt.blockNumber, receipt.blockHash, giftIDs, amounts)

        const openActionGiftReceipt = await openActionGiftsTx.wait()
        console.log("openActionGifts Gas Usage:", openActionGiftReceipt.gasUsed);

        const actionInfoBNNew = actionInfo.blockHeigh.shl(224).add(actionInfo.domainID.shl(208))
                .add(actionInfo.boxStart.shl(184)).add(actionInfo.boxAmount.shl(160))
                .add(counterBN.shl(32)).add(BigNumber.from(1).shl(223))

        const greenActions = await greenBTC2.greenActions(1)
        expect(greenActions).to.eq(actionInfoBNNew)

        expect(await AKREToken.balanceOf(greenBTCGift.address)).to.eq(balanceAKREBefore.add(amountAKRE))                  
        expect(await tokenA.balanceOf(greenBTCGift.address)).to.eq(balanceTokeanABefore.add(amountTokenA))                  

        const amount1 = await greenBTCGift.balanceOf(owner1.address, 1)                           
        const amount2 = await greenBTCGift.balanceOf(owner1.address, 2)
        const amount3 = await greenBTCGift.balanceOf(owner1.address, 3)
        const amount5 = await greenBTCGift.balanceOf(owner1.address, 81)                            
        const amount6 = await greenBTCGift.balanceOf(owner1.address, 82)
        expect(amount1).to.eq(giftCounter[0])
        expect(amount2).to.eq(giftCounter[1])
        expect(amount3).to.eq(giftCounter[2])
        expect(amount5).to.eq(giftCounter[4])
        expect(amount6).to.eq(giftCounter[5])

        await expect(greenBTC2.connect(owner1).openActionGifts(1, receipt.blockNumber, receipt.blockHash, {v,r,s}))
                            .to.be.revertedWith("GBC2: Action Opened")

        ////////// 2nd openActionGifts //////////////////////////////////
        {
          await kWhToken.approve(greenBTC2.address, constants.MaxUint256)

          const makeGreenBoxTx2 = await greenBTC2.makeGreenBox(1,456)
          const receipt2 = await makeGreenBoxTx2.wait()

          actionInfo.actionID = BigNumber.from(2)
          actionInfo.boxStart = BigNumber.from(123)
          actionInfo.boxAmount = BigNumber.from(456)
          actionInfo.actor = deployer.address
          actionInfo.blockHeigh = BigNumber.from(receipt2.blockNumber)
          actionInfo.blockHash = receipt2.blockHash

          const  { counters: countersCheck2, wonList: wonListCheck2 } = UtilCalculateGifts(actionInfo)

          for (let index=0; index<8; index++ ) {
            allCounters[index] += (index==0) ? countersCheck2[index] :  countersCheck2[index] - countersCheck2[index-1]
          }
  
          const digest2 = getGreenBitcoinClaimGifts(
              'Green BTC Club',
              greenBTC2.address,
              2,
              receipt2.blockNumber,
              receipt2.blockHash
            )

          const {v:v2, r:r2, s:s2} = ecsign(Buffer.from(digest2.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))  

          await mine(5)

          //const {counters: counters2, wonList: wonList2} = await greenBTC2.checkIfShot(owner1.address, 1, Bytes32_Zero)
          const {counters: counters2, wonList: wonList2} = await greenBTC2.checkIfShot(deployer.address, 2, Bytes32_Zero)

          const openActionGiftsTx = await greenBTC2.connect(owner1).openActionGifts(2, receipt2.blockNumber, receipt2.blockHash, {v:v2, r:r2, s:s2})

          const openActionGiftReceipt = await openActionGiftsTx.wait()
          console.log("openActionGifts Gas Usage:", openActionGiftReceipt.gasUsed);

          expect(counters2).to.deep.eq(countersCheck2)
          expect(wonList2).to.deep.eq(wonListCheck2)
        }

        {
          // await kWhToken.approve(greenBTC2.address, constants.MaxUint256)

          const makeGreenBoxTx = await greenBTC2.makeGreenBox(1, 234)
          const receipt = await makeGreenBoxTx.wait()
  
          actionInfo.actionID = BigNumber.from(3)
          actionInfo.boxStart = BigNumber.from(123+456)
          actionInfo.boxAmount = BigNumber.from(234)
          actionInfo.actor = deployer.address
          actionInfo.blockHeigh = BigNumber.from(receipt.blockNumber)
          actionInfo.blockHash = receipt.blockHash
  
          const { counters, wonList } = UtilCalculateGifts(actionInfo)

          for (let index=0; index<8; index++ ) {
            allCounters[index] += (index==0) ? counters[index] :  counters[index] - counters[index-1]
          }
 
          const digest2 = getGreenBitcoinClaimGifts(
              'Green BTC Club',
              greenBTC2.address,
              3,
              receipt.blockNumber,
              receipt.blockHash
            )
  
          const {v, r, s} = ecsign(Buffer.from(digest2.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))  
  
          await mine(5)
  
          const {counters: counters2, wonList: wonList2} = await greenBTC2.checkIfShot(deployer.address, 3, Bytes32_Zero)
  
          const openActionGiftsTx = await greenBTC2.openActionGifts(3, receipt.blockNumber, receipt.blockHash, {v, r, s})

          const openActionGiftReceipt = await openActionGiftsTx.wait()
          console.log("openActionGifts Gas Usage:", openActionGiftReceipt.gasUsed);
  
          expect(counters2).to.deep.eq(counters)
          expect(wonList2).to.deep.eq(wonList)

          const domainStatus = await greenBTC2.domainStatus(1)

          let domainStatusBN = BigNumber.from(123+456+234).shl(224)

          for (let index=0; index<8; index++ ) {
            domainStatusBN = domainStatusBN.add(BigNumber.from(allCounters[index]).shl(24*(7-index)))
          }
          
          // Check domainStatus updating
          expect(BigNumber.from(domainStatus)).to.eq(domainStatusBN)

        }

      });

      it("GreenPower initGift Test", async function () {
        await expect(greenBTCGift.initGift(5, Bytes32_Zero))
              .to.be.revertedWith("GBTC: Wrong Gift Info")

        await expect(greenBTCGift.initGift(1, BigNumber.from(AKREToken.address).shl(96).add(value10000).toHexString()))
              .to.be.revertedWith("GBTC: Gift Repteated")
      })

      it("GreenPower claimGift Test", async function () {

        // AKRE used for gift
        await AKREToken.approve(greenBTC2.address, constants.MaxUint256)
        await greenBTC2.depositFund(AKREToken.address, expandTo18Decimals(100000000))

        await greenBTC2.registerDomain(1, domainInfoBigInt.toHexString())

        await kWhToken.connect(owner1).approve(greenBTC2.address, constants.MaxUint256)
        const makeGreenBoxTx = await  greenBTC2.connect(owner1).makeGreenBox(1,123)
        const receipt = await makeGreenBoxTx.wait()

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

        const claimGiftTX = await greenBTCGift.connect(owner1).claimGift(3, amount3.sub(BigNumber.from(2)))
        const claimGiftReceipt = await claimGiftTX.wait()
        console.log("claimGift Gas Usage:", claimGiftReceipt.gasUsed);

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

      it("GreenPower claimGiftBatch test", async function () {

        // AKRE used for gift
        await AKREToken.approve(greenBTC2.address, constants.MaxUint256)
        await greenBTC2.depositFund(AKREToken.address, expandTo18Decimals(100000000))

        await greenBTC2.registerDomain(1, domainInfoBigInt.toHexString())

        await kWhToken.connect(owner1).approve(greenBTC2.address, constants.MaxUint256)
        const makeGreenBoxTx = await  greenBTC2.connect(owner1).makeGreenBox(1,123)
        const receipt = await makeGreenBoxTx.wait()

        const digest = getGreenBitcoinClaimGifts(
            'Green BTC Club',
            greenBTC2.address,
            1,
            receipt.blockNumber,
            receipt.blockHash
          )

        const {v,r,s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKeyManager.slice(2), 'hex'))   

        await mine(5)
        const openActionGiftsTx = await greenBTC2.connect(owner1).openActionGifts(1, receipt.blockNumber, receipt.blockHash, {v,r,s})
        const openActionGiftReceipt = await openActionGiftsTx.wait()
        console.log("openActionGifts Gas Usage:", openActionGiftReceipt.gasUsed);

        const amount2 = await greenBTCGift.balanceOf(owner1.address, 2)
        const amount3 = await greenBTCGift.balanceOf(owner1.address, 3)

        await expect(greenBTCGift.connect(owner1).claimGiftBatch([1, 2,3], [amount2, amount3]))
                  .to.be.revertedWith("GBTC: Wrong Length")

        await expect(greenBTCGift.connect(owner1).claimGiftBatch([2,5], [amount2, amount3]))
                  .to.be.revertedWith("ERC1155: burn amount exceeds balance")

        let claimGiftBatchTx

        const balanace1 = await AKREToken.balanceOf(owner1.address)
        expect(claimGiftBatchTx = await greenBTCGift.connect(owner1).claimGiftBatch([2,3], [amount2, amount3]))
                  .to.emit(greenBTCGift, 'GiftBatchClaimed')
                  .withArgs(owner1.address, [2,3], [amount2, amount3])

        expect(await AKREToken.balanceOf(owner1.address))
                .to.eq(balanace1.add(amount2.mul(expandTo18Decimals(1000))).add(amount3.mul(expandTo18Decimals(100))))

        const claimGiftBatchReceipt = await claimGiftBatchTx.wait()
        console.log("claimGiftBatch Gas Usage:", claimGiftBatchReceipt.gasUsed);
      });
*/
    })
})