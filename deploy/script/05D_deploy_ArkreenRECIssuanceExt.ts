import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", "ArkreenRECIssuanceExt.sol");  

  // For Simulation mode, need to remove the checking if being miner
  const ArkreenRECIssuanceExt = await deploy("ArkreenRECIssuanceExt", {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("ArkreenRECIssuance deployed to %s: ", hre.network.name, ArkreenRECIssuanceExt.address);
};

// 2023/02/26: 
// yarn deploy:matic_test:RECIssueExtD
// 0x53abcbfc0818039bac5f72429af025eaf566b624

// 2023/03/22: 
// yarn deploy:matic:RECIssueExtD
// 0x677174509c37c91e6675f6203608195c456d8b13

func.tags = ["RECIssueExtD"];

export default func;
