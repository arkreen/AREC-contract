import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { StakingRewards__factory } from "../../typechain";

import { expandTo18Decimals } from "../../test/utils/utilities";

import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(35_000_000_000) : BigNumber.from(80_000_000_000)
  
  if(hre.network.name === 'matic_test') {
    // 2024/05/21
    // const stakingRewardsAddress  = "0x691938a6e88a85E66Aab05ECf84Fe84ECE8351C9"        // Amoy testnet
    const stakingRewardsAddress0  = "0xe233f1aC801eD919A774295503eCFE359A647B8B"          // 2024/05/22: Amoy testnet
    const stakingRewardsAddress1  = "0x1f74d233c159Eb99a81FB067076cf2C86D5a3F06"          // 2024/06/21: Amoy testnet, Proxy1
    const stakingRewardsAddress2  = "0x09806c44a1a87A5Db3d3b21839C8eDB6049355B5"          // 2024/06/21: Amoy testnet, Proxy2
    const stakingRewardsAddress3  = "0xDfDe48f6A4E57989c8916D9f9f467803D36E6412"          // 2024/06/21: Amoy testnet, Proxy3
    const stakingRewardsAddress4  = "0x83A53493180677DBF298b5C9f454DED4f73FD0F1"          // 2024/06/21: Amoy testnet, Proxy3
    const stakingRewardsAddress5  = "0xa2c7FD9d6F9fCD50000DAaC552d931E0185D3Be6"          // 2024/06/21: Amoy testnet, Proxy3

    let stakingRewardsAddress = stakingRewardsAddress5

    const stakingRewards = StakingRewards__factory.connect(stakingRewardsAddress, deployer);

    // 2024/05/21, Amoy testnet
    // 2024/06/21, Amoy testnet
    // 2024/09/24, Amoy testnet
    const capMinerPremium = expandTo18Decimals(5000)      // proxy 0, proxy 1, 2024/06/21
    const ratePremium = 200                               // proxy 0, proxy 1, 2024/06/21

    //const capMinerPremium = expandTo18Decimals(6000)    // proxy 2, 2024/06/21
    //const ratePremium = 250                             // proxy 2, 2024/06/21

    //const capMinerPremium = expandTo18Decimals(8000)    // proxy 3, 2024/06/21
    //const ratePremium = 300                             // proxy 3, 2024/06/21

    // 2024/05/22: Amoy testnet: 2nd Deployment
    //const capMinerPremium = expandTo18Decimals(6000)
    //const ratePremium = 200

    /*
    await stakingRewards.changeUnstakeLock(true, {gasPrice: defaultGasPrice})            // with Lock

    const setStakeParameterTx = await stakingRewards.setStakeParameter(capMinerPremium, ratePremium, {gasPrice: defaultGasPrice})
    await setStakeParameterTx.wait()
    console.log("StakingRewards setStakeParameter Tx:", setStakeParameterTx)
    console.log("Set StakeParameter: ", hre.network.name, 
                    stakingRewardsAddress, capMinerPremium.toString(), ratePremium);
    */

/*                    
    // 2024/09/24, Amoy testnet
    const start = 1727164800
    const end = 1727424000
    const rewardTotal = expandTo18Decimals(10000)
*/
    // 2024/09/24, Amoy testnet
    const start = 1727251200
    const end = 1727769600
    const rewardTotal = expandTo18Decimals(25000)

    // Need to approve first
    const depolyRewardsTx = await stakingRewards.depolyRewards(start, end, rewardTotal, {gasPrice: defaultGasPrice})
    console.log("Depoly Rewards: ", hre.network.name, depolyRewardsTx);

  }
  if(hre.network.name === 'matic') {
    // 2024/05/28
    //const stakingRewardsAddress  = "0xa777d8855456eac0E3f1C64c148dabaf8e8CcC1F"         // 2024/05/28: Polygon Mainnet
    //const stakingRewardsAddress  = "0x4C15968df54B276dC06eF11Bcd3b3EfFbC577c59"         // 2024/006/25(XXX): Polygon Mainnet, with lock
    //const stakingRewardsAddress  = "0xc1dCE2f17362C2De4ab4F104f6f88223e0c28B95"         // 2024/006/25: Polygon Mainnet, with lock
    //const stakingRewardsAddress  = "0x0A0688fc15794035820CaDc23Db7114bAb4dE405"         // 2024/07/25A: Polygon Mainnet, 60 days lock
    //const stakingRewardsAddress  = "0x071Bed72c917859e73f99dDa41Fb6B2Ea4C08d33"         // 2024/07/25B: Polygon Mainnet, 60 days lock
    //const stakingRewardsAddress  = "0x39c518133a60a7517eed15EA21E8A0Cf1AB66D46"         // 2024/09/29: Polygon Mainnet, 30 days lock
    //const stakingRewardsAddress  = "0xDA6E63C0be2DE7FAA29a4E8a7ca0d14F280636e5"         // 2024/09/29: Polygon Mainnet, 60 days lock
    const stakingRewardsAddress    = "0x1ea66a305b763ef50a16842be27Cd68Ec7F69e68"         // 2024/10/25: Polygon Mainnet, 90 days lock

    const stakingRewards = StakingRewards__factory.connect(stakingRewardsAddress, deployer);

/*    
    // 2024/06/25: Polygon Mainnet， 2024/07/25A、2024/07/25B, 2024/09/29A, 2024/10/25
    const changeUnstakeLockTx = await stakingRewards.changeUnstakeLock(true, {gasPrice: defaultGasPrice})
    await changeUnstakeLockTx.wait()

    // 2024/05/28, 2024/06/25: Polygon Mainnet, 2024/07/25A、2024/07/25B, 2024/09/29A
    const capMinerPremium = expandTo18Decimals(5000)
    const ratePremium = 200

    const setStakeParameterTx = await stakingRewards.setStakeParameter(capMinerPremium, ratePremium, {gasPrice: defaultGasPrice})
    await setStakeParameterTx.wait()

    console.log("StakingRewards setStakeParameter Tx:", changeUnstakeLockTx, setStakeParameterTx)
    console.log("Set StakeParameter: ", hre.network.name, 
                    stakingRewardsAddress, capMinerPremium.toString(), ratePremium);
*/

/*
    // 2024/09/30A, Polygon mainnet
    const start = 1727683200    // 2024/09/30
    const end = 1730275200      // 2024/10/30
    const rewardTotal = expandTo18Decimals(80000)
*/

/*
    // 2024/09/30B, Polygon mainnet
    const start = 1727683200    // 2024/09/30
    const end = 1732867200      // 2024/11/29
    const rewardTotal = expandTo18Decimals(250000)
*/

    // 2024/10/26, Polygon mainnet
    const start = 1730188800    // 2024/10/29
    const end = 1737964800      // 2025/01/27
    const rewardTotal = expandTo18Decimals(800000)

    // Need to approve first
    const depolyRewardsTx = await stakingRewards.depolyRewards(start, end, rewardTotal, {gasPrice: defaultGasPrice})
    console.log("Depoly Rewards: ", hre.network.name, depolyRewardsTx);

  }

};

// 2024/05/21: Call setStakeParameter (Amoy testnet)
// yarn deploy:matic_test:StakingRewardsI

// 2024/05/22: Call setStakeParameter (Amoy testnet)
// yarn deploy:matic_test:StakingRewardsI

// 2024/05/28: Call setStakeParameter (Polygon mainnet)
// yarn deploy:matic:StakingRewardsI
// call setStakeParameter

// 2024/06/21: Call setStakeParameter (Amoy testnet)
// yarn deploy:matic_test:StakingRewardsI
// call changeUnstakeLock and setStakeParameter (proxy1)

// 2024/06/25: Call changeUnstakeLock and setStakeParameter (Polygon mainnet)
// yarn deploy:matic:StakingRewardsI
// call changeUnstakeLock and setStakeParameter

// 2024/07/25A: Call changeUnstakeLock and setStakeParameter (Polygon mainnet)
// yarn deploy:matic:StakingRewardsI
// call changeUnstakeLock and setStakeParameter

// 2024/09/24A: Call changeUnstakeLock and setStakeParameter (Amoy testnet)
// yarn deploy:matic_test:StakingRewardsI
// call changeUnstakeLock and setStakeParameter
// 0x83A53493180677DBF298b5C9f454DED4f73FD0F1
// 0xa2c7FD9d6F9fCD50000DAaC552d931E0185D3Be6

// 2024/09/24A: Call depolyRewards (Amoy testnet)
// yarn deploy:matic_test:StakingRewardsI
// 0x83A53493180677DBF298b5C9f454DED4f73FD0F1
// 0xa2c7FD9d6F9fCD50000DAaC552d931E0185D3Be6

// 2024/09/29A: Call changeUnstakeLock and setStakeParameter (Polygon mainnet)
// yarn deploy:matic:StakingRewardsI  （30D: 0x39c518133a60a7517eed15EA21E8A0Cf1AB66D46）
// call changeUnstakeLock and setStakeParameter

// 2024/09/29B: Call changeUnstakeLock and setStakeParameter (Polygon mainnet)
// yarn deploy:matic:StakingRewardsI  （60D: 0xDA6E63C0be2DE7FAA29a4E8a7ca0d14F280636e5
// call changeUnstakeLock and setStakeParameter

// 2024/09/30A: Call depolyRewards (Polygon mainnet)
// yarn deploy:matic:StakingRewardsI
// 0x39c518133a60a7517eed15EA21E8A0Cf1AB66D46

// 2024/09/30B: Call depolyRewards (Polygon mainnet)
// yarn deploy:matic:StakingRewardsI
// 0xDA6E63C0be2DE7FAA29a4E8a7ca0d14F280636e5

// 2024/10/25: Call changeUnstakeLock and setStakeParameter (Polygon mainnet)
// yarn deploy:matic:StakingRewardsI  （90D: 0x1ea66a305b763ef50a16842be27Cd68Ec7F69e68
// call changeUnstakeLock and setStakeParameter

// 2024/10/26: Call depolyRewards (Polygon mainnet)( 90D AKRE)
// yarn deploy:matic:StakingRewardsI
// 0x1ea66a305b763ef50a16842be27Cd68Ec7F69e68


func.tags = ["StakingRewardsI"];

export default func;

