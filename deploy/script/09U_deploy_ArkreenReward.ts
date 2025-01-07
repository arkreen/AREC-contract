import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ArkreenReward__factory } from "../../typechain";
import { BigNumber, constants } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const [deployer] = await ethers.getSigners();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(35_000_000_000)
  
  if(hre.network.name === 'matic_test') {
    const PROXY_ADDRESS       = "0x78F018BF6af8C9A366735CFf0689486A0855bF89"        // Need to check
//  const NEW_IMPLEMENTATION  = "0xeb0a8d25cc479825e6ca942d516a1534c32dfbe4"        // First implementation
    const NEW_IMPLEMENTATION  = "0x17F0a72D7cb4f24acee2824f79a0761E7d9fC6f6"        // 2025/01/07: Support withdrawing to different address

    const ArkreenReward = ArkreenReward__factory.connect(PROXY_ADDRESS, deployer);

    const updateTx = await  ArkreenReward.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
    await updateTx.wait()

    console.log("updateTx: ", updateTx)
    console.log("ArkreenReward upgraded to %s: ", hre.network.name, ArkreenReward.address, NEW_IMPLEMENTATION);

  } else if(hre.network.name === 'matic') {
//    const PROXY_ADDRESS       = "0x2f4277e7ec4fc9980aa4f81d82e30575550099a9"       // Need to check
      const PROXY_ADDRESS       = "0xDcF10d429c0422Af80790bC810A33189771D643d"       // Need to check
//    const NEW_IMPLEMENTATION  = "0xd718fcc418e835c8db91bbb9b90e2f9a6833ebaa"       // First implementation
//    const NEW_IMPLEMENTATION  = "0x313e5870434DC6c296Ae67FB3582FBA1A70Fe96e"       // 2nd implementation
      const NEW_IMPLEMENTATION  = "0x893B01da28FA4aB3E6445D25Ffe3F2c66D0bE256"       // 2025/01/07: Support withdrawing to different address

      const ArkreenReward = ArkreenReward__factory.connect(PROXY_ADDRESS, deployer);

      const updateTx = await  ArkreenReward.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()

      console.log("updateTx: ", updateTx)
      console.log("ArkreenReward upgraded to %s: ", hre.network.name, ArkreenReward.address, NEW_IMPLEMENTATION);
  } 
};

// 2025/01/17
// yarn deploy:matic_test:ARewardU              
// 0x17F0a72D7cb4f24acee2824f79a0761E7d9fC6f6:        Support withdrawing to different address

// 2025/01/17: Polygon Mainnet
// yarn deploy:matic:ARewardU              
// 0x893B01da28FA4aB3E6445D25Ffe3F2c66D0bE256:        Support withdrawing to different address

func.tags = ["ARewardU"];

export default func;
