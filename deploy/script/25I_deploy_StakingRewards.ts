import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { StakingRewards__factory } from "../../typechain";

import { expandTo18Decimals } from "../../test/utils/utilities";

import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(35_000_000_000) : BigNumber.from(50_000_000_000)
  
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
    //const stakingRewardsAddress  = "0xa777d8855456eac0E3f1C64c148dabaf8e8CcC1F"         // 2024/05/28: Polygon Mainnet
    //const stakingRewardsAddress  = "0x4C15968df54B276dC06eF11Bcd3b3EfFbC577c59"         // 2024/006/25(XXX): Polygon Mainnet, with lock
    //const stakingRewardsAddress  = "0xc1dCE2f17362C2De4ab4F104f6f88223e0c28B95"         // 2024/006/25: Polygon Mainnet, with lock
    //const stakingRewardsAddress  = "0x0A0688fc15794035820CaDc23Db7114bAb4dE405"         // 2024/07/25A: Polygon Mainnet, 60 days lock
    const stakingRewardsAddress    = "0x071Bed72c917859e73f99dDa41Fb6B2Ea4C08d33"         // 2024/07/25B: Polygon Mainnet, 60 days lock

    const stakingRewards = StakingRewards__factory.connect(stakingRewardsAddress, deployer);

    // 2024/06/25: Polygon Mainnet， 2024/07/25A、2024/07/25B
    const changeUnstakeLockTx = await stakingRewards.changeUnstakeLock(true, {gasPrice: defaultGasPrice})
    await changeUnstakeLockTx.wait()

    // 2024/05/28, 2024/06/25: Polygon Mainnet, 2024/07/25A、2024/07/25B
    const capMinerPremium = expandTo18Decimals(5000)
    const ratePremium = 200

    const setStakeParameterTx = await stakingRewards.setStakeParameter(capMinerPremium, ratePremium, {gasPrice: defaultGasPrice})
    await setStakeParameterTx.wait()

    console.log("StakingRewards setStakeParameter Tx:", changeUnstakeLockTx, setStakeParameterTx)
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

// 2024/06/25: Call changeUnstakeLock and setStakeParameter (Polygon mainnet)
// yarn deploy:matic:StakingRewardsI
// call changeUnstakeLock and setStakeParameter

// 2024/07/25A: Call changeUnstakeLock and setStakeParameter (Polygon mainnet)
// yarn deploy:matic:StakingRewardsI
// call changeUnstakeLock and setStakeParameter

func.tags = ["StakingRewardsI"];

export default func;

