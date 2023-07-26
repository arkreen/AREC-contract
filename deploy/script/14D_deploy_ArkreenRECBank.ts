import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", CONTRACTS.ArtBank, deployer);  

  const arkreenRECBank = await deploy(CONTRACTS.ArtBank, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("arkreenRECBank deployed to %s: ", hre.network.name, arkreenRECBank.address);
};

// 2023/07/26
// deploy:matic_test:ArtBankD
// 0x84AEAe330517A89Ab74f5eD0f805522634dF8Df6

func.tags = ["ArtBankD"];

export default func;
