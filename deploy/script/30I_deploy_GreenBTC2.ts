
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { StakingRewards__factory } from "../../typechain";
import { GreenBTC2S__factory } from "../../typechain";
import { getGreenBitcoinClaimGifts, getGreenBitcoinClaimGiftsRaw  } from '../../test/utils/utilities'
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'

import { BigNumber } from "ethers";
import { config as dotEnvConfig } from "dotenv"

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer, signer] = await ethers.getSigners();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(75_000_000_000)

   
  if(hre.network.name === 'matic_test') {
    // 2024/07/05
    const GreenBTC2SAddress  = "0xf276AD41bA60e723188496318Ba0E41733C9fF3F"          // 2024/07/05: Amoy testnet: Lite Version

    const GreenBTC2S = GreenBTC2S__factory.connect(GreenBTC2SAddress, deployer);
     
    // 2024/07/05: Amoy testnet
    const domainId = 68
    const domainInfo = "0x0303060600000bb8000f00c803e8000001f405dc000000000800000000000000"

    const registerDomainTx = await GreenBTC2S.registerDomain(domainId, domainInfo, {gasPrice: defaultGasPrice})
    await registerDomainTx.wait()

    console.log("GreenBTC2S registerDomain: ", hre.network.name, GreenBTC2SAddress, domainId, domainInfo );
  
  }
  if(hre.network.name === 'matic') {
    // 2024/06/13
    const GreenBTC2SAddress  = "0xa777d8855456eac0E3f1C64c148dabaf8e8CcC1F"           // 2024/06/13: Polygon Mainnet
    const GreenBTC2S = StakingRewards__factory.connect(GreenBTC2SAddress, deployer);
  }
};

// 2024/07/05: Call registerDomain (Amoy mainnet): 0xf276AD41bA60e723188496318Ba0E41733C9fF3F
// yarn deploy:matic_test:GreenBTC2SI
// call: registerDomain

func.tags = ["GreenBTC2SI"];

export default func;
