import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(6000000000) : BigNumber.from(100000000000)

  console.log("Deploying: ", 'ArkreenBadgeImage', deployer, defaultGasPrice.toString());  

  const GreenBTCImage = await deploy('ArkreenBadgeImage', {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
  });

  console.log("GreenBTCImage deployed to %s: ", hre.network.name, GreenBTCImage.address);
};

// 2024/01/1: Matic testnet:  ArkreenBadgeImage
// yarn deploy:matic_test:ArkreenBadgeImageD
// 

func.tags = ["ArkreenBadgeImageD"];

export default func;
