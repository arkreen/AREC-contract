import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", 'GreenBTCImage', deployer);  

  const GreenBTCImage = await deploy('GreenBTCImage', {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("GreenBTCImage deployed to %s: ", hre.network.name, GreenBTCImage.address);
};

// 2023/10/23
// yarn deploy:matic_test:GreenBTCImageD:
// 0x27a30F0B401cC5Cd7bb5477E4fA290CeDFfA8cc7

func.tags = ["GreenBTCImageD"];

export default func;