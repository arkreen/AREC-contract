import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log("Deploying ArkreenToken...");  
  const ArkreenTokenFactory = await ethers.getContractFactory("ArkreenToken");
  const ArkreenToken = await ArkreenTokenFactory.deploy(10_000_000_000);
  await ArkreenToken.deployed();
  console.log("ArkreenToken deployed to %s:", hre.network.name, ArkreenToken.address);
};

export default func;
func.tags = ["ARKE"];