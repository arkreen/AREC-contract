import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(50_000_000_000)
  
  console.log("Deploying ArkreenMinerPro: ", deployer);  
  
  const ArkreenMinerPro = await deploy("ArkreenMinerPro", {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
  });

  console.log("ArkreenMinerPro deployed to %s: ", hre.network.name, ArkreenMinerPro.address);

};

// 2024/05/21: yarn deploy:matic_test:AMinerProD 
// Deployed on Polygon Amoy testnet to upgrade to support for staking
// 0xCf427e3E8B3717DE2d0d08Cc09F1A3c5853Dd90C

// 2024/05/28: yarn deploy:matic:AMinerProD 
// Deployed on Polygon main to upgrade to support for staking
// 0xB6701746312304F9f751bEe707fa0ca51Ec6724c

export default func;
func.tags = ["AMinerProD"];
