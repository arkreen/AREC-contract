import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ArkreenReward__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
   
  if(hre.network.name === 'matic') {
      const PROXY_ADDRESS       = "0x2f4277e7ec4fc9980aa4f81d82e30575550099a9"       // Need to check
//    const NEW_IMPLEMENTATION  = "0xd718fcc418e835c8db91bbb9b90e2f9a6833ebaa"       // First implementation
      const NEW_IMPLEMENTATION  = "0x313e5870434DC6c296Ae67FB3582FBA1A70Fe96e"       // 2nd implementation

      const [deployer] = await ethers.getSigners();
      const ArkreenReward = ArkreenReward__factory.connect(PROXY_ADDRESS, deployer);

      const updateTx = await  ArkreenReward.upgradeTo(NEW_IMPLEMENTATION)
      await updateTx.wait()

      console.log("updateTx: ", updateTx)
      console.log("ArkreenReward upgraded to %s: ", hre.network.name, ArkreenReward.address, NEW_IMPLEMENTATION);
  } 
};

func.tags = ["ARewardU"];

export default func;
