import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

import { PlugMinerSales__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(75_000_000_000)
 
  console.log("Deploying: ", "PlugMinerSales", deployer);  

  const plugMinerSales = await deploy('PlugMinerSales', {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
  });

  console.log("PlugMinerSales deployed to %s: ", hre.network.name, plugMinerSales.address);
};

// 2025/01/10
// yarn deploy:matic_test:PlugMinerSalesD    : Amoy testnet (Dev Anv)
// Implementaion:         0x1b6209dFb258ba757066CC8BDa987d592962b375

// 2025/01/10
// yarn deploy:matic:PlugMinerSalesD    : Polygon mainnet
// Implementaion:         0x23D224309983ce2fC02535729420FED9462c3f63

// 2025/01/13
// yarn deploy:matic_test:PlugMinerSalesD    : Amoy testnet (Dev Anv)
// Implementaion:         0xfA99FD9C58AF9dCBCe4019c0F5227b7263a31C08

func.tags = ["PlugMinerSalesD"];

export default func;
