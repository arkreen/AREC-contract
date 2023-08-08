import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", 'Multicall', deployer);  

  const Multicall = await deploy('Multicall', {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("Multicall deployed to %s: ", hre.network.name, Multicall.address);
};

// 2023/07/18
// deploy:matic:MulticallD
// 0xe15F1eDC35e987604C8658aCE8c0A75d4F23a030

// 2023/07/19
// deploy:matic_test:MulticallD
// 0x3a004D2777F3099f428ec45593636BcA69515B85

// 2023/08/05
// deploy:matic_test:MulticallD:  Address address to the returned data
// 0x0836851450d157FeAb2c84850f7907Ab563006Be

func.tags = ["MulticallD"];

export default func;
