import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts,getChainId } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainID = await getChainId()
  const defaultGasPrice = (chainID === '80001') ? BigNumber.from(3_000_000_000) : BigNumber.from(160_000_000_000)

  console.log("Deploying GreenBTCPro: ", deployer, chainID, defaultGasPrice.toString());  

  const greenBTC = await deploy("GreenBTCPro", {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
  });

  console.log("greenBTC deployed to %s: ", hre.network.name, greenBTC.address);
};

// 2024/04/28: Deploy on Amoy testnet
// yarn deploy:matic_test:GreenBTCProD
// Implemenation: 0x4201963061ee4FB285c19D84F1b39170142e533a

func.tags = ["GreenBTCProD"];

export default func;
