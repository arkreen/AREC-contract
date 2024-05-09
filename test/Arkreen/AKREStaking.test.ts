import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
//const {ethers, upgrades} =  require("hardhat");

import { ethers, network, upgrades } from "hardhat";
import { Block } from "@ethersproject/abstract-provider";

//import hre from 'hardhat'
//import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'
//import { getPermitDigest, getDomainSeparator, expandTo18Decimals, randomAddresses } from '../utils/utilities'
import { constants, BigNumber, } from 'ethers'
import { expandTo18Decimals, expandTo9Decimals } from "../utils/utilities"

import {
    ArkreenToken,
    StakingRewards,
} from "../../typechain";

const startTime = 60 * 60 * 24                        // start 1 days later
const endTime =  startTime + 60 * 60 * 24 * 60        // 2 month
const amountReward = expandTo9Decimals(20000)                      // 9408471
const rewardRate = amountReward.mul(expandTo18Decimals(1)).mul(expandTo18Decimals(1)).div(endTime-startTime)

interface stakeStatus {
  stakeAmount:          BigNumber,
  lastTimeStamp:        number,
  rewardsPerStakePaid:  BigNumber
  earnStored:           BigNumber
}

const initStatus: stakeStatus = { stakeAmount: BigNumber.from(0), lastTimeStamp: 0, 
                                  rewardsPerStakePaid:BigNumber.from(0), earnStored: BigNumber.from(0) } 

describe("StakingRewards test", ()=> {

    let deployer: SignerWithAddress
    let user1:  SignerWithAddress
    let user2: SignerWithAddress
    let user3: SignerWithAddress

    let lastBlockN:   Block
    let startTimestamp = 0 
    let endTimestamp = 0
    let lastUpdateTime = 0 

    let arkreenToken:             ArkreenToken
    let artToken:                 ArkreenToken
    let stakingRewards:           StakingRewards

    let allStakeAmount    = BigNumber.from(0)
    let lastRewardsPerStakePaid = BigNumber.from(0)

    let user1StakeStatus: stakeStatus = {...initStatus}
    let user2StakeStatus: stakeStatus = {...initStatus}
    let user3StakeStatus: stakeStatus = {...initStatus}

    async function deployFixture() {
        const [deployer, user1, user2, user3] = await ethers.getSigners();

        const ArkreenTokenFactory = await ethers.getContractFactory("ArkreenToken")
        const arkreenToken: ArkreenToken = await upgrades.deployProxy(
                                ArkreenTokenFactory, [10000000000, deployer.address, '', '']) as ArkreenToken
  
        await arkreenToken.deployed()

        const artToken: ArkreenToken = await upgrades.deployProxy(
                                ArkreenTokenFactory, [10000000000, deployer.address, 'ART Token', 'ART']) as ArkreenToken

        await artToken.deployed()

        const stakingRewardsFactory = await ethers.getContractFactory("StakingRewards")
        const stakingRewards: StakingRewards = await stakingRewardsFactory.deploy(
                                            arkreenToken.address, artToken.address, deployer.address)
        await stakingRewards.deployed()

        await artToken.approve(stakingRewards.address, constants.MaxUint256)

        await arkreenToken.transfer(user1.address, expandTo18Decimals(1000000))
        await arkreenToken.transfer(user2.address, expandTo18Decimals(2000000))
        await arkreenToken.transfer(user3.address, expandTo18Decimals(5000000))

        const lastBlock = await ethers.provider.getBlock('latest')
   
        //await stakingRewards.depolyRewards()

        return {arkreenToken, artToken, stakingRewards, deployer, user1, user2, user3}
    }

    function getLastRewardsPerStake() {
      const lastTimeRewardApplicable = lastBlockN.timestamp < endTimestamp ? lastBlockN.timestamp : endTimestamp
      const lastUpdateTimeForReward = lastUpdateTime < startTimestamp ? startTimestamp : lastUpdateTime

//      const rewardRatePerStake = allStakeAmount.eq(0) ? BigNumber.from(0) :rewardRate.div(allStakeAmount)
//      console.log("\r\nWWWWWWWWWWWWWWWWWWWW", lastBlockN.timestamp, lastTimeRewardApplicable, 
//                                              startTimestamp, endTimestamp, rewardRatePerStake.toString())

      const rewardsPerStakeIncrease = startTimestamp == 0  || lastBlockN.timestamp <= startTimestamp || allStakeAmount.eq(0) 
                                      ? BigNumber.from(0)
                                      : rewardRate.mul(lastTimeRewardApplicable-lastUpdateTimeForReward).div(allStakeAmount)

//      console.log("\r\nVVVVVVVVVVVVVVVVVVVVV", lastRewardsPerStakePaid, rewardsPerStakeIncrease)

      return lastRewardsPerStakePaid.add(rewardsPerStakeIncrease)
    }                                    

    async function user1Stake(amount: BigNumber) {
      await stakingRewards.connect(user1).stake(amount)
      lastBlockN = await ethers.provider.getBlock('latest')

      lastRewardsPerStakePaid = getLastRewardsPerStake()
      const newRewards = user1StakeStatus.stakeAmount.mul(lastRewardsPerStakePaid.sub(user1StakeStatus.rewardsPerStakePaid))

      allStakeAmount = allStakeAmount.add(amount)
      user1StakeStatus.stakeAmount = user1StakeStatus.stakeAmount.add(amount)
      user1StakeStatus.lastTimeStamp = lastBlockN.timestamp
      user1StakeStatus.rewardsPerStakePaid = lastRewardsPerStakePaid
      user1StakeStatus.earnStored = user1StakeStatus.earnStored.add(newRewards).div(expandTo18Decimals(1)).div(expandTo18Decimals(1))

      lastUpdateTime = lastBlockN.timestamp

//      console.log("User 1", lastBlockN.timestamp, user1StakeStatus.stakeAmount.toString(), 
//          user2StakeStatus.stakeAmount.toString(), user3StakeStatus.stakeAmount.toString(), allStakeAmount.toString())
    }

    async function user2Stake(amount: BigNumber) {
      await stakingRewards.connect(user2).stake(amount)
      lastBlockN = await ethers.provider.getBlock('latest')

      lastRewardsPerStakePaid = getLastRewardsPerStake()
      const newRewards = user2StakeStatus.stakeAmount.mul(lastRewardsPerStakePaid.sub(user2StakeStatus.rewardsPerStakePaid))

      allStakeAmount = allStakeAmount.add(amount)
      user2StakeStatus.stakeAmount = user2StakeStatus.stakeAmount.add(amount)
      user2StakeStatus.lastTimeStamp = lastBlockN.timestamp
      user2StakeStatus.rewardsPerStakePaid = lastRewardsPerStakePaid
      user2StakeStatus.earnStored = user2StakeStatus.earnStored.add(newRewards).div(expandTo18Decimals(1)).div(expandTo18Decimals(1))

      lastUpdateTime = lastBlockN.timestamp

//      console.log("User 2", lastBlockN.timestamp, user2StakeStatus.stakeAmount.toString(), 
//          user2StakeStatus.stakeAmount.toString(), user3StakeStatus.stakeAmount.toString(), allStakeAmount.toString())
    }

    async function user3Stake(amount: BigNumber) {
      await stakingRewards.connect(user3).stake(amount)
      lastBlockN = await ethers.provider.getBlock('latest')

      lastRewardsPerStakePaid = getLastRewardsPerStake()
      const newRewards = user3StakeStatus.stakeAmount.mul(lastRewardsPerStakePaid.sub(user3StakeStatus.rewardsPerStakePaid))

      allStakeAmount = allStakeAmount.add(amount)
      user3StakeStatus.stakeAmount = user3StakeStatus.stakeAmount.add(amount)
      user3StakeStatus.lastTimeStamp = lastBlockN.timestamp
      user3StakeStatus.rewardsPerStakePaid = lastRewardsPerStakePaid
      user3StakeStatus.earnStored = user3StakeStatus.earnStored.add(newRewards).div(expandTo18Decimals(1)).div(expandTo18Decimals(1))

      lastUpdateTime = lastBlockN.timestamp

//      console.log("User 3", lastBlockN.timestamp, user3StakeStatus.stakeAmount.toString(), 
//            user2StakeStatus.stakeAmount.toString(), user3StakeStatus.stakeAmount.toString(), allStakeAmount.toString())
    }

    async function checkEarnedUser1() {
      lastBlockN = await ethers.provider.getBlock('latest')
      const lastRewardsPerStakePaidTemp = getLastRewardsPerStake()
      const newRewards = user1StakeStatus.stakeAmount
                            .mul(lastRewardsPerStakePaidTemp.sub(user1StakeStatus.rewardsPerStakePaid))
                            .div(expandTo18Decimals(1)).div(expandTo18Decimals(1))

//      console.log("11111111111111111", user1StakeStatus.stakeAmount.toString(), lastRewardsPerStakePaidTemp.toString(),
//            user2StakeStatus.earnStored.toString(), newRewards.toString())

      expect(await stakingRewards.earned(user1.address)).to.eq(
            user1StakeStatus.earnStored.add(newRewards))
    }

    async function checkEarnedUser2() {
      lastBlockN = await ethers.provider.getBlock('latest')
      const lastRewardsPerStakePaidTemp = getLastRewardsPerStake()

      const newRewards = user2StakeStatus.stakeAmount
                        .mul(lastRewardsPerStakePaidTemp.sub(user2StakeStatus.rewardsPerStakePaid))
                        .div(expandTo18Decimals(1)).div(expandTo18Decimals(1))

//      console.log("222222222222222", user2StakeStatus.stakeAmount.toString(), lastRewardsPerStakePaidTemp.toString(),
//            user2StakeStatus.earnStored.toString(), newRewards.toString())

      expect(await stakingRewards.earned(user2.address)).to.eq(user2StakeStatus.earnStored.add(newRewards))
    }

    async function checkEarnedUser3() {
      lastBlockN = await ethers.provider.getBlock('latest')
      const lastRewardsPerStakePaidTemp = getLastRewardsPerStake()
      const newRewards = user3StakeStatus.stakeAmount
                          .mul(lastRewardsPerStakePaidTemp.sub(user3StakeStatus.rewardsPerStakePaid))
                          .div(expandTo18Decimals(1)).div(expandTo18Decimals(1))

//      console.log("3333333333333333", user2StakeStatus.stakeAmount.toString(), lastRewardsPerStakePaidTemp.toString(),
//            user2StakeStatus.earnStored.toString(), newRewards.toString())

      expect(await stakingRewards.earned(user3.address)).to.eq(user3StakeStatus.earnStored.add(newRewards))
    }

    describe('StakingRewards test', () => {
      beforeEach(async () => {
        const fixture = await loadFixture(deployFixture)
        arkreenToken = fixture.arkreenToken
        artToken = fixture.artToken        
        stakingRewards = fixture.stakingRewards
        deployer = fixture.deployer
        user1 = fixture.user1
        user2 = fixture.user2
        user3 = fixture.user3

        await arkreenToken.connect(user1).approve(stakingRewards.address, constants.MaxUint256)
        await arkreenToken.connect(user2).approve(stakingRewards.address, constants.MaxUint256)
        await arkreenToken.connect(user3).approve(stakingRewards.address, constants.MaxUint256)
      })

      it("StakingRewards before stake deposit", async function () {
   
        const lastBlock = await ethers.provider.getBlock('latest')

        const stake1 = expandTo18Decimals(100000)
        const stake2 = expandTo18Decimals(400000)
        const stake3 = expandTo18Decimals(500000)

        await user1Stake(stake1)
        await user2Stake(stake2)
        await user3Stake(stake3)

        expect(await stakingRewards.earned(user1.address)).to.equal(BigNumber.from(0))
        expect(await stakingRewards.earned(user2.address)).to.equal(BigNumber.from(0))
        expect(await stakingRewards.earned(user3.address)).to.equal(BigNumber.from(0))

        startTimestamp = lastBlock.timestamp + startTime
        endTimestamp = lastBlock.timestamp + endTime

        await stakingRewards.depolyRewards(startTimestamp, endTimestamp, amountReward )

        await user1Stake(stake1)
        await user2Stake(stake2)
        await user3Stake(stake3)

        await ethers.provider.send("evm_increaseTime", [startTime -100]);
        await mine(1)

        expect(await stakingRewards.earned(user1.address)).to.equal(BigNumber.from(0))
        expect(await stakingRewards.earned(user2.address)).to.equal(BigNumber.from(0))
        expect(await stakingRewards.earned(user3.address)).to.equal(BigNumber.from(0))

        await ethers.provider.send("evm_increaseTime", [100]);
        await mine(1)

        lastBlockN = await ethers.provider.getBlock('latest')       // Must keep to update the lastBlockN

        await checkEarnedUser1()
        await checkEarnedUser2()
        await checkEarnedUser3()

        await ethers.provider.send("evm_increaseTime", [60*60*24*10]);
        await mine(1)

        await user1Stake(stake1)
        await checkEarnedUser1()

        await user2Stake(stake2)
        await checkEarnedUser2()

        await user3Stake(stake3)
        await checkEarnedUser3()

        await ethers.provider.send("evm_increaseTime", [60*60*24*2]);
        await mine(1)
        await user1Stake(stake1)
        await checkEarnedUser1()
        await checkEarnedUser2()
        await checkEarnedUser3()

        await ethers.provider.send("evm_increaseTime", [60*60*24*4]);
        await mine(1)
        await user2Stake(stake2)
        await checkEarnedUser1()
        await checkEarnedUser2()
        await checkEarnedUser3()
        
        await ethers.provider.send("evm_increaseTime", [60*60*24*4]);
        await mine(1)
        await user3Stake(stake3)
        await checkEarnedUser1()
        await checkEarnedUser2()
        await checkEarnedUser3()

        // Period ended
        await ethers.provider.send("evm_increaseTime", [60*60*24*40]);
        await mine(1)

        lastBlockN = await ethers.provider.getBlock('latest')       // Must keep to update the lastBlockN

        await checkEarnedUser1()
        await checkEarnedUser2()
        await checkEarnedUser3()
        
      });


      it("StakingRewards after stake deposit", async function () {

        const lastBlock = await ethers.provider.getBlock('latest')

        const stake1 = expandTo18Decimals(100000)
        const stake2 = expandTo18Decimals(400000)
        const stake3 = expandTo18Decimals(500000)

        await user1Stake(stake1)
        await user2Stake(stake2)
        await user3Stake(stake3)

        expect(await stakingRewards.earned(user1.address)).to.equal(BigNumber.from(0))
        expect(await stakingRewards.earned(user2.address)).to.equal(BigNumber.from(0))
        expect(await stakingRewards.earned(user3.address)).to.equal(BigNumber.from(0))


        console.log("11111111111111111111111111111\r\n")
        await stakingRewards.depolyRewards(lastBlock.timestamp + startTime, lastBlock.timestamp + endTime, amountReward )

        startTimestamp = lastBlock.timestamp + startTime


        await stakingRewards.connect(user1).stake(stake1)
        console.log("4444444444444444444444444444444444\r\n")

        await stakingRewards.connect(user2).stake(stake2)
        console.log("5555555555555555555555555555\r\n")

        await stakingRewards.connect(user3).stake(stake3)
        console.log("66666666666666666666666666666\r\n")

        await ethers.provider.send("evm_increaseTime", [startTime + 1]);
        await mine(1)
        const lastBlockA = await ethers.provider.getBlock('latest')

        const  earnedUser1 = await stakingRewards.earned(user1.address)
       

        const earnedUser1T  = rewardRate.mul(stake1).mul(lastBlockA.timestamp-startTimestamp)
                              .div(stake1.add(stake2).add(stake3))
                              .div(expandTo18Decimals(1)).div(expandTo18Decimals(1))


        console.log("777777777777777777777777",  lastBlockA.timestamp, startTimestamp, "\r\n")

        const  earnedUser2 = await stakingRewards.earned(user2.address)
        const earnedUser2T  = rewardRate.mul(stake2).mul(lastBlockA.timestamp-startTimestamp)
                              .div(stake1.add(stake2).add(stake3))
                              .div(expandTo18Decimals(1)).div(expandTo18Decimals(1))
        console.log("8888888888888888888888888888888\r\n")

        const  earnedManager = await stakingRewards.earned(user3.address)
        const earnedUser3T  = rewardRate.mul(stake3).mul(lastBlockA.timestamp-startTimestamp)
                              .div(stake1.add(stake2).add(stake3))
                              .div(expandTo18Decimals(1)).div(expandTo18Decimals(1))

        console.log("9999999999999999999999999999\r\n")

        {
          await stakingRewards.connect(user1).stake(stake1)

          const  earnedUser1 = await stakingRewards.earned(user1.address)
          const earnedUser1T  = rewardRate.mul(stake1).mul(lastBlockA.timestamp-startTimestamp)
                                .div(stake1.add(stake2).add(stake3))
                                .div(expandTo18Decimals(1)).div(expandTo18Decimals(1))

          console.log("AAAAAAAAAAAAAAAAAAA",  lastBlockA.timestamp, startTimestamp, earnedUser1.toString(),
                        earnedUser1T.toString(), "\r\n")
        }

        const lastBlockB = await ethers.provider.getBlock('latest')

        console.log("SSSSSSSSSSSS", lastBlock.timestamp, lastBlock.timestamp + startTime + 1, lastBlockA.timestamp, lastBlockB.timestamp)
        console.log("AAAAAAAAAAA", rewardRate.toString(), arkreenToken.address, artToken.address, stakingRewards.address)
        console.log("BBBBBBBBBBB",  earnedUser1.toString(), earnedUser1T.toString(),
                                    earnedUser2.toString(), earnedUser2T.toString(),
                                    earnedManager.toString(), earnedUser3T.toString())

        console.log("CCCCCCCCCCCCCC", lastBlockB)
        
      });      

    })
})