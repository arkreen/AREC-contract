import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", CONTRACTS.RECIssuance, deployer);  

  // For Simulation mode, need to remove the checking if being miner
  const ArkreenRECIssuance = await deploy(CONTRACTS.RECIssuance, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("ArkreenRECIssuance deployed to %s: ", hre.network.name, ArkreenRECIssuance.address);
};

// 2023/02/26: 
// yarn deploy:matic_test:RECIssueD
// 0x8Dc3cd4666909D09aCf8d7197fD4E5F43D7ae4aB

// 2023/02/26: 
// yarn deploy:matic_test:RECIssueD
// 0x5e9a9a89e4b5229ec5789e2da1c995a3b1224275

// 2023/04/02: Add "setTokenAKRE"
// yarn deploy:matic_test:RECIssueD
// 0x51016eafbc75058391beeea156ab6b8ad9b92e52

// 2023/04/02: Add "setTokenAKRE"
// yarn deploy:matic:RECIssueD
// 0x966721720dC732464D2C5594AfF9b0Aa52E1b0e8

// 2024/01/01: Add "setARECImage"
// yarn deploy:matic_test:RECIssueD
// 0x829e71F96A35ff3ba1c0BfE388d8d470c95106A6

// 2024/02/20: Remove miner checking for simulation mode
// yarn deploy:matic_test:RECIssueD
// 0x96CF764dad84a8B377C8696201e05D49259A59B4

func.tags = ["RECIssueD"];

export default func;
