
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { StakingRewards__factory } from "../../typechain";
import { GreenBTC2__factory } from "../../typechain";

import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(75_000_000_000)
  
  if(hre.network.name === 'matic_test') {
    // 2024/06/13
    //const greenBTC2Address  = "0x20E45e53B813788C2D169D3D861A4C0Ae3bDD4eA"        // 2024/06/13: Amoy testnet
    const greenBTC2Address  = "0x7670fE3CD59a43082214d070150Fa31D2054cB7a"          // 2024/06/15: Amoy testnet: Remove data from GreenBTC
    
    const greenBTC2 = GreenBTC2__factory.connect(greenBTC2Address, deployer);

    // 2024/06/13, 2024/06/15: Amoy testnet
    const greenBTCGift = "0x644d45543027E72Ecb653732c1363584710FF609"
    const setStakeParameterTx = await greenBTC2.setGreenBTCGift(greenBTCGift, {gasPrice: defaultGasPrice})
    await setStakeParameterTx.wait()

    console.log("GreenBTC2 set GreenBTCGift: ", hre.network.name, greenBTC2Address, greenBTCGift);
  }
  if(hre.network.name === 'matic') {
    // 2024/06/13
    const greenBTC2Address  = "0xa777d8855456eac0E3f1C64c148dabaf8e8CcC1F"           // 2024/06/13: Polygon Mainnet
    const greenBTC2 = StakingRewards__factory.connect(greenBTC2Address, deployer);
  }
};

// 2024/06/13: Call setGreenBTCGift (Amoy mainnet): 0x644d45543027E72Ecb653732c1363584710FF609
// yarn deploy:matic_test:GreenBTC2I
// call setGreenBTCGift

// 2024/06/15: Call setGreenBTCGift (Amoy mainnet): 0x7670fE3CD59a43082214d070150Fa31D2054cB7a
// yarn deploy:matic_test:GreenBTC2I
// call setGreenBTCGift

func.tags = ["GreenBTC2I"];

export default func;

