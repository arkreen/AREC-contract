import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { StakingRewards__factory } from "../../typechain";

import { expandTo18Decimals } from "../../test/utils/utilities";

import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(35_000_000_000) : BigNumber.from(75_000_000_000)
  
  if(hre.network.name === 'matic_test') {
    // 2024/05/21
    // const stakingRewardsAddress  = "0x691938a6e88a85E66Aab05ECf84Fe84ECE8351C9"        // Amoy testnet
    const stakingRewardsAddress0  = "0xe233f1aC801eD919A774295503eCFE359A647B8B"          // 2024/05/22: Amoy testnet
    const stakingRewardsAddress1  = "0x1f74d233c159Eb99a81FB067076cf2C86D5a3F06"          // 2024/06/21: Amoy testnet, Proxy1
    const stakingRewardsAddress2  = "0x09806c44a1a87A5Db3d3b21839C8eDB6049355B5"          // 2024/06/21: Amoy testnet, Proxy2
    const stakingRewardsAddress3  = "0xDfDe48f6A4E57989c8916D9f9f467803D36E6412"          // 2024/06/21: Amoy testnet, Proxy3

    let stakingRewardsAddress = stakingRewardsAddress0

    const stakingRewards = StakingRewards__factory.connect(stakingRewardsAddress, deployer);

    // 2024/05/21, Amoy testnet
    // 2024/06/21, Amoy testnet
    const capMinerPremium = expandTo18Decimals(5000)    // proxy 0, proxy 1, 2024/06/21
    const ratePremium = 200                             // proxy 0, proxy 1, 2024/06/21

    //const capMinerPremium = expandTo18Decimals(6000)      // proxy 2, 2024/06/21
    //const ratePremium = 250                               // proxy 2, 2024/06/21

    //const capMinerPremium = expandTo18Decimals(8000)    // proxy 3, 2024/06/21
    //const ratePremium = 300                             // proxy 3, 2024/06/21

    // 2024/05/22: Amoy testnet: 2nd Deployment
    //const capMinerPremium = expandTo18Decimals(6000)
    //const ratePremium = 200

    await stakingRewards.changeUnstakeLock(false, {gasPrice: defaultGasPrice})            // with Lock

    const setStakeParameterTx = await stakingRewards.setStakeParameter(capMinerPremium, ratePremium, {gasPrice: defaultGasPrice})
    await setStakeParameterTx.wait()

    console.log("StakingRewards setStakeParameter Tx:", setStakeParameterTx)
    console.log("Set StakeParameter: ", hre.network.name, 
                    stakingRewardsAddress, capMinerPremium.toString(), ratePremium);
  }
  if(hre.network.name === 'matic') {
    // 2024/05/28
    const stakingRewardsAddress  = "0xa777d8855456eac0E3f1C64c148dabaf8e8CcC1F"           // 2024/05/28: Polygon Mainnet

    const stakingRewards = StakingRewards__factory.connect(stakingRewardsAddress, deployer);

    // 2024/05/21, Amoy testnet
//    const capMinerPremium = expandTo18Decimals(5000)
//    const ratePremium = 250

    // 2024/05/22: Amoy testnet: 2nd Deployment
//  const capMinerPremium = expandTo18Decimals(6000)
//  const ratePremium = 200

    // 2024/05/28: Polygon Mainnet
    const capMinerPremium = expandTo18Decimals(5000)
    const ratePremium = 200

    const setStakeParameterTx = await stakingRewards.setStakeParameter(capMinerPremium, ratePremium, {gasPrice: defaultGasPrice})
    await setStakeParameterTx.wait()

    console.log("StakingRewards setStakeParameter Tx:", setStakeParameterTx)
    console.log("Set StakeParameter: ", hre.network.name, 
                    stakingRewardsAddress, capMinerPremium.toString(), ratePremium);
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

func.tags = ["StakingRewardsI"];

export default func;

