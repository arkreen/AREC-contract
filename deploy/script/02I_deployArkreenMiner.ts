import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";
import { ArkreenMiner__factory } from "../../typechain";
import { ethers } from "hardhat";
import { utils } from 'ethers'

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const [deployer] = await ethers.getSigners();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(100000000000)

    if(hre.network.name === 'matic')  {
      const MINER_PROXY_ADDRESS = "0xbf8eF5D950F78eF8edBB8674a48cDACa675831Ae"       // Miner Contract in production env
      const NEW_IMPLEMENTATION =  "0xeCAac43Ef76a7c76613986FaaAd26707a3BFF59a"       // 2024/05/28: Upgrade to support StakingRewards (App register/listen)

      const arkreenMiner = ArkreenMiner__factory.connect(MINER_PROXY_ADDRESS, deployer);

      // 2024/05/28, Call registerListenApps
      const appid = 1
      const stakingRewards = "0xa777d8855456eac0E3f1C64c148dabaf8e8CcC1F"

      // registerListenApps(uint256 appid, address newApp)
      await arkreenMiner.registerListenApps(appid, stakingRewards, {gasPrice: defaultGasPrice})

      console.log("New ArkreenMiner deployed to %s:", hre.network.name, NEW_IMPLEMENTATION, stakingRewards);
    
    }
};

// 2024/05/28
// yarn deploy:matic:AMinerI    : Polygon mainnet
// call registerListenApps: (1, 0xa777d8855456eac0E3f1C64c148dabaf8e8CcC1F)

func.tags = ["AMinerI"];

export default func;
