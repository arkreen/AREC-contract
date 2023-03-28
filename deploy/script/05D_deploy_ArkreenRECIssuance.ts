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

func.tags = ["RECIssueD"];

export default func;
