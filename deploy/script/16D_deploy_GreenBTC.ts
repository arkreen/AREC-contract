import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", 'GreenBTC', deployer);  

  const GreenBTC = await deploy('GreenBTC', {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("GreenBTC deployed to %s: ", hre.network.name, GreenBTC.address);
};

// 2023/10/24
// yarn deploy:matic_test:GreenBTCD:
// 0x9642086fF6748329b0e08583E703E98499498EE2

func.tags = ["GreenBTCD"];

export default func;
