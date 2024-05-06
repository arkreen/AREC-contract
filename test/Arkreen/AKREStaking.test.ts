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

    async function user1Stake(amount: BigNumber) {
      await stakingRewards.connect(user1).stake(amount)
      lastBlockN = await ethers.provider.getBlock('latest')

      const lastTimeRewardApplicable = lastBlockN.timestamp < endTimestamp ? lastBlockN.timestamp : endTimestamp
      const rewardsPerStakeIncrease = lastBlockN.timestamp < startTimestamp 
                                      ? BigNumber.from(0)
                                      : rewardRate.mul(lastTimeRewardApplicable-lastUpdateTime).div(allStakeAmount)
      
      lastRewardsPerStakePaid = lastRewardsPerStakePaid.add(rewardsPerStakeIncrease)

      const newRewards = user1StakeStatus.stakeAmount.mul(lastRewardsPerStakePaid.sub())
      user1StakeStatus.earnStored = await stakingRewards.earned(user1.address)

      lastUpdateTime = lastBlockN.timestamp

      allStakeAmount = allStakeAmount.add(amount)
      user1StakeStatus.stakeAmount = user1StakeStatus.stakeAmount.add(amount)
      
      user1StakeStatus.earnStored = await stakingRewards.earned(user1.address)

       myStakes[account].mul(rewardPerToken().sub(myRewardsPerStakePaid[account])).div(1e36).add(myRewards[account]);


      user1StakeStatus.lastTimeStamp = lastBlockN.timestamp
      user1StakeStatus.rewardsPerStakePaid = rewardRate.div(allStakeAmount)
      lastRewardsPerStakePaid = user1StakeStatus.rewardsPerStakePaid

      console.log("User 1", lastBlockN.timestamp, user1StakeStatus.stakeAmount.toString(), 
          user2StakeStatus.stakeAmount.toString(), user3StakeStatus.stakeAmount.toString(), allStakeAmount.toString())
    }

    async function user2Stake(amount: BigNumber) {
      await stakingRewards.connect(user2).stake(amount)
      lastBlockN = await ethers.provider.getBlock('latest')
      allStakeAmount = allStakeAmount.add(amount)
      user2StakeStatus.stakeAmount = user2StakeStatus.stakeAmount.add(amount)
      user2StakeStatus.earnStored = await stakingRewards.earned(user2.address)
      user2StakeStatus.lastTimeStamp = lastBlockN.timestamp
      user2StakeStatus.rewardsPerStakePaid = rewardRate.div(allStakeAmount)
      lastRewardsPerStakePaid = user2StakeStatus.rewardsPerStakePaid

      console.log("User 2", lastBlockN.timestamp, user2StakeStatus.stakeAmount.toString(), 
          user2StakeStatus.stakeAmount.toString(), user3StakeStatus.stakeAmount.toString(), allStakeAmount.toString())
    }

    async function user3Stake(amount: BigNumber) {
      await stakingRewards.connect(user3).stake(amount)
      lastBlockN = await ethers.provider.getBlock('latest')
      allStakeAmount = allStakeAmount.add(amount)
      user3StakeStatus.stakeAmount = user3StakeStatus.stakeAmount.add(amount)
      user3StakeStatus.earnStored = await stakingRewards.earned(user3.address)
      user3StakeStatus.lastTimeStamp = lastBlockN.timestamp
      user3StakeStatus.rewardsPerStakePaid = rewardRate.div(allStakeAmount)
      lastRewardsPerStakePaid = user3StakeStatus.rewardsPerStakePaid

      console.log("User 3", lastBlockN.timestamp, user3StakeStatus.stakeAmount.toString(), 
            user2StakeStatus.stakeAmount.toString(), user3StakeStatus.stakeAmount.toString(), allStakeAmount.toString())
    }

    function getEarnedUser1() {
      const startTime = user1StakeStatus.lastTimeStamp < startTimestamp ? startTimestamp : user1StakeStatus.lastTimeStamp
      const endTime = lastBlockN.timestamp > endTimestamp ? endTimestamp : lastBlockN.timestamp

      console.log("User1 earned: SSSSSSSSSSS", rewardRate.toString(), lastBlockN.timestamp, startTimestamp, endTimestamp, endTime, startTime)
      console.log("User1 earned: DDDDDDDDDD", lastRewardsPerStakePaid, user1StakeStatus)
      
      const earnedUser1 = user1StakeStatus.stakeAmount.mul(lastRewardsPerStakePaid.sub(user1StakeStatus.rewardsPerStakePaid))
              .mul(endTime-startTime).add(user1StakeStatus.earnStored).div(expandTo18Decimals(1)).div(expandTo18Decimals(1))

      console.log("User1 earned:", user1StakeStatus.stakeAmount.toString(), lastBlockN.timestamp, user1StakeStatus.lastTimeStamp,
                          allStakeAmount.toString(), earnedUser1.toString(), user1StakeStatus.earnStored.toString())
      return earnedUser1               
    }

    function getEarnedUser2() {
      const startTime = user2StakeStatus.lastTimeStamp < startTimestamp ? startTimestamp : user2StakeStatus.lastTimeStamp
      const endTime = lastBlockN.timestamp > endTimestamp ? startTimestamp : lastBlockN.timestamp

//      const earnedUser2 = rewardRate.mul(user2StakeStatus.stakeAmount).mul(endTime-startTime)
//            .div(allStakeAmount).div(expandTo18Decimals(1)).add(user2StakeStatus.earnStored)

      const earnedUser2 = user2StakeStatus.stakeAmount.mul(lastRewardsPerStakePaid.sub(user2StakeStatus.rewardsPerStakePaid))
              .mul(endTime-startTime).add(user2StakeStatus.earnStored).div(expandTo18Decimals(1)).div(expandTo18Decimals(1))

      console.log("User2 earned:", user2StakeStatus.stakeAmount.toString(), lastBlockN.timestamp, startTimestamp,
      allStakeAmount.toString(), earnedUser2.toString())                  
      return earnedUser2             
    }

    function getEarnedUser3() {
      const startTime = user3StakeStatus.lastTimeStamp < startTimestamp ? startTimestamp : user3StakeStatus.lastTimeStamp
      const endTime = lastBlockN.timestamp > endTimestamp ? startTimestamp : lastBlockN.timestamp

//      const earnedUser3 = rewardRate.mul(user3StakeStatus.stakeAmount).mul(endTime-startTime)
//              .div(allStakeAmount).div(expandTo18Decimals(1)).add(user3StakeStatus.earnStored)

      const earnedUser3 = user3StakeStatus.stakeAmount.mul(lastRewardsPerStakePaid.sub(user3StakeStatus.rewardsPerStakePaid))
              .mul(endTime-startTime).add(user3StakeStatus.earnStored).div(expandTo18Decimals(1)).div(expandTo18Decimals(1))

      console.log("User3 earned:", user3StakeStatus.stakeAmount.toString(), lastBlockN.timestamp, startTimestamp,
              allStakeAmount.toString(), earnedUser3.toString())                                    
      return earnedUser3           
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

        expect(await stakingRewards.earned(user1.address)).to.equal(getEarnedUser1())                              
        expect(await stakingRewards.earned(user2.address)).to.equal(getEarnedUser2())  
        expect(await stakingRewards.earned(user3.address)).to.equal(getEarnedUser3())     

        await ethers.provider.send("evm_increaseTime", [60*60*24*10]);
        await mine(1)

        await user1Stake(stake1)
        expect(await stakingRewards.earned(user1.address)).to.equal(getEarnedUser1())                              

        await user2Stake(stake2)
        expect(await stakingRewards.earned(user2.address)).to.equal(getEarnedUser2())                              

        await user3Stake(stake3)
        expect(await stakingRewards.earned(user3.address)).to.equal(getEarnedUser3())                              

        // Period ended
        await ethers.provider.send("evm_increaseTime", [60*60*24*50]);
        await mine(1)

        lastBlockN = await ethers.provider.getBlock('latest')       // Must keep to update the lastBlockN

        console.log("SSSSSSSSSSSS", lastBlock.timestamp, lastBlockN.timestamp, startTimestamp, endTimestamp)

//        const earnedUser1 = await stakingRewards.earned(user1.address)
//        const earnedUser2 = await stakingRewards.earned(user2.address)
//        const earnedUser3 = await stakingRewards.earned(user3.address)


        expect(await stakingRewards.earned(user1.address)).to.equal(getEarnedUser1())                              
        expect(await stakingRewards.earned(user2.address)).to.equal(getEarnedUser2())                              
        expect(await stakingRewards.earned(user3.address)).to.equal(getEarnedUser3())                              

        const lastBlockB = await ethers.provider.getBlock('latest')

        console.log("SSSSSSSSSSSS", lastBlock.timestamp, lastBlock.timestamp + startTime + 1, lastBlockN.timestamp, lastBlockB.timestamp)
        console.log("AAAAAAAAAAA", rewardRate.toString(), arkreenToken.address, artToken.address, stakingRewards.address)
        console.log("BBBBBBBBBBB",  getEarnedUser1().toString(), getEarnedUser2().toString(),
                                    getEarnedUser3().toString())

        console.log("CCCCCCCCCCCCCC", lastBlockB)
        
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