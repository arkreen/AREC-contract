import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(6000000000) : BigNumber.from(100000000000)

  console.log("Deploying: ", 'ArkreenRECIssuanceImage', deployer, defaultGasPrice.toString());  

  const GreenBTCImage = await deploy('ArkreenRECIssuanceImage', {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
  });

  console.log("GreenBTCImage deployed to %s: ", hre.network.name, GreenBTCImage.address);
};

// 2024/01/1(A): Matic testnet:  ArkreenRECIssuanceImage
// yarn deploy:matic_test:ArkreenRECIssuanceImageD
// 0x5F8dE063558Ffb782760A0dC6de6108c4387356e

// 2024/01/1(B): Matic testnet: ArkreenRECIssuanceImage, fix bug
// yarn deploy:matic_test:ArkreenRECIssuanceImageD
// 0xB4B19F8381bf6a44CDc8591294683Bf21C8997cb

func.tags = ["ArkreenRECIssuanceImageD"];

export default func;
