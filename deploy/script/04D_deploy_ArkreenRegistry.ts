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

// 2023/02/26: 
// yarn deploy:matic_test:gRegistryD
// 0x29840f70cb8ddbfba9890c40c1babc6a2c904e6c

// 2023/04/4: Upgrade to update tAKRE
// yarn deploy:matic:gRegistryD
// 0x8668dD561a693aB7F8B48b599B692F2EFB070937

// 2024/01/11: Upgrade to update REC issuer on Celo Network
// yarn deploy:celo_test:gRegistryD
// 0x19444425121096d92c0eEC7eFf84ba0094C8f634

// 2024/01/11A: Upgrade to update REC issuer on Celo Network (Bug Fixed)
// yarn deploy:celo_test:gRegistryD
// 0xB2Dda4591b015BC96632FEB0d24B65AB7485959f

func.tags = ["gRegistryD"];

export default func;
