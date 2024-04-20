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

// 2023/04/02: Update to correct bug of cancelRECRequest
// yarn deploy:matic_test:RECIssueExtD
// 0x0bABeE40F62D946d5DE5beEC48C5C4c453C6b1F0

// 2023/04/02: Update to correct bug of cancelRECRequest
// yarn deploy:matic:RECIssueExtD
// 0x5CdcCdBcCC590893344933003628Ac9B29e593Dd

// 2023/08/21:
// yarn deploy:celo_test:RECIssueExtD
// 0x42d4eff140e9903F682DC11931aD3E1437D7ACA1

// 2023/08/31:
// yarn deploy:celo_test:RECIssueExtD: Upgrade to support issuance payment with approved token
// 0xCA308f3082729D5960f8726593F15686AA49FCbc

// 2023/08/31:
// yarn deploy:celo_test:RECIssueExtD: skip the payment value check while it is zero
// 0x31ad3b7DC83bc00C321E927dE11AD313eEB9C07e

// 2023/10/31:
// yarn deploy:celo:RECIssueExtD
// 0xD718fcC418e835C8dB91BbB9B90e2F9a6833EbAA

// 2024/04/15:
// yarn deploy:matic_test:RECIssueExtD
// 0xC409b1c8809e7af02c01FcC0084a3fd89f703609

// 2024/04/20: Deployed on Polygon Amoy testnet 
// yarn deploy:matic_test:RECIssueExtD
// 0xDCF44b641cA619b7070C9B8F9C80aF87D221060a

func.tags = ["RECIssueExtD"];

export default func;
