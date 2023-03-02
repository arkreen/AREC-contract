import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", CONTRACTS.gRegistry, deployer);  

  // For Simulation mode, need to remove the checking if being miner
  const ArkreenRegistry = await deploy(CONTRACTS.gRegistry, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("ArkreenRegistry deployed to %s: ", hre.network.name, ArkreenRegistry.address);
};

func.tags = ["gRegistryD"];

export default func;
