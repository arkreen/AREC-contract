import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(6000000000) : BigNumber.from(50000000000)

  console.log("Deploying: ", 'GreenBTCImage', deployer, defaultGasPrice.toString());  

  const GreenBTCImage = await deploy('GreenBTCImage', {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
  });

  console.log("GreenBTCImage deployed to %s: ", hre.network.name, GreenBTCImage.address);
};

// 2023/10/23
// yarn deploy:matic_test:GreenBTCImageD:
// 0x27a30F0B401cC5Cd7bb5477E4fA290CeDFfA8cc7

// 2023/10/25
// yarn deploy:matic_test:GreenBTCImageD:
// 0xc44ab5E1C00f9df586b80DDbAF00220974a97bC5

// 2023/10/26: Add ART flag, and shown owner 
// yarn deploy:matic_test:GreenBTCImageD
// 0x99C26b45949073a73b98b568de399B1569fe008c

// 2023/10/26: revert? Abort
// yarn deploy:matic_test:GreenBTCImageD
// 0x2c5a2D33aA7CeABa69C8DE595720a8Fd621B3D00

// 2023/10/26: POWER -> ENERGY
// yarn deploy:matic_test:GreenBTCImageD
// 0x5b92c6E11A98F76CF20d878A79150A09bB24C24f


func.tags = ["GreenBTCImageD"];

export default func;
