import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", CONTRACTS.ABuilder, deployer);  

  const ArkreenBuilder = await deploy(CONTRACTS.ABuilder, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("ArkreenBuilder deployed to %s: ", hre.network.name, ArkreenBuilder.address);
};

// 2023/03/14
// deploy:matic_test:ABuilderD
// 0x16dB479F500aeE6C1683955e0E34394fe81Be12d

func.tags = ["ABuilderD"];

export default func;
