import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(6_000_000_000) : BigNumber.from(80_000_000_000)

  console.log("Deploying: ", 'ArkreenRECIssuanceImage', deployer, defaultGasPrice.toString());  

  /*
  // Polygon Testnet (Simu)
  const arkreenRECIssuance = '0x95f56340889642A41b913C32d160d2863536E073'
  const arkreenRECIssuanceImageLogo = '0x865a3129677A2d38A85386940F5140Dbb5021efa'
  */

  // Polygon Testnet (Simu)
  const arkreenRECIssuance = '0x954585adF9425F66a0a2FD8e10682EB7c4F1f1fD'
  const arkreenRECIssuanceImageLogo = '0x58105aa8Aba5d55B8c0962a1C924827e4CACeeB8'

  const GreenBTCImage = await deploy('ArkreenRECIssuanceImage', {
      from: deployer,
      args: [arkreenRECIssuance, arkreenRECIssuanceImageLogo],
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

// 2024/02/23: Matic testnet: Add ArkreenRECIssuanceImageLogo to store Arkreen logo
// yarn deploy:matic_test:ArkreenRECIssuanceImageD
// 0xA881049ba78A8f1b314AaF557C507332cC5D7DD8

// 2024/02/24: Arkreen mainnet launch on Polygon: Add ArkreenRECIssuanceImageLogo to store Arkreen logo
// yarn deploy:matic:ArkreenRECIssuanceImageD
// 0xf1c78E697440Ff8eECDf411E7CeC3fF26957971b

func.tags = ["ArkreenRECIssuanceImageD"];

export default func;
