import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", CONTRACTS.GreenBTC, deployer);  

  const greenBTC = await deploy(CONTRACTS.GreenBTC, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("arkreenRECBank deployed to %s: ", hre.network.name, greenBTC.address);
};

// 2023/10/24
// yarn deploy:matic_test:GreenBTCD
// Implemenation:   0x17533f8C83eaFbacE7443647Ec9C2326190955Fb

func.tags = ["GreenBTCD"];

export default func;
