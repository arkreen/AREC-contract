import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber, constants } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(36_000_000_000)

  console.log("Deploying: ", CONTRACTS.AReward, deployer);  

  const ArkreenReward = await deploy(CONTRACTS.AReward, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
  });

  console.log("ArkreenReward deployed to %s: ", hre.network.name, ArkreenReward.address);
};

// 2025/01/17
// yarn deploy:matic_test:ARewardD
// 0x17F0a72D7cb4f24acee2824f79a0761E7d9fC6f6

// 2025/01/17:    Polygon Mainnet
// yarn deploy:matic:ARewardD
// 0x893B01da28FA4aB3E6445D25Ffe3F2c66D0bE256

func.tags = ["ARewardD"];

export default func;
