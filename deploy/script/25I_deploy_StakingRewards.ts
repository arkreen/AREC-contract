import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { StakingRewards__factory } from "../../typechain";

import { expandTo18Decimals } from "../../test/utils/utilities";

import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(75_000_000_000)
  
  if(hre.network.name === 'matic_test') {
    // 2024/05/21
    // const stakingRewardsAddress  = "0x691938a6e88a85E66Aab05ECf84Fe84ECE8351C9"        // Amoy testnet
    const stakingRewardsAddress  = "0xe233f1aC801eD919A774295503eCFE359A647B8B"           // 2024/05/22: Amoy testnet

    const stakingRewards = StakingRewards__factory.connect(stakingRewardsAddress, deployer);

    // 2024/05/21, Amoy testnet
//    const capMinerPremium = expandTo18Decimals(5000)
//    const ratePremium = 250

    // 2024/05/22: Amoy testnet: 2nd Deployment
    const capMinerPremium = expandTo18Decimals(6000)
    const ratePremium = 200

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

func.tags = ["StakingRewardsI"];

export default func;

