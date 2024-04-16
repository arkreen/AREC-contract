import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(100_000_000_000)

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
// 0x65c78eaC38aa9B5eaa871d6cd22598E011aC1164

// 2024/02/22: Matic mainnet for Arkreen mainnet launch:  ArkreenBadgeImage
// yarn deploy:matic:ArkreenBadgeImageD
// 0x9b2987e8B169402B535efF2d328440593b8B5240

// 2024/04/16: Matic testnet:  ArkreenBadgeImage
// yarn deploy:matic_test:ArkreenBadgeImageD
// 0xd10eA37C185CC3eaA952b3c27D5ec754d40C1741

func.tags = ["ArkreenBadgeImageD"];

export default func;
