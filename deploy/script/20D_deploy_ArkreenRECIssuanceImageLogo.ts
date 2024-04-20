import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(80_000_000_000)

  console.log("Deploying: ", 'ArkreenRECIssuanceImageLogo', deployer, defaultGasPrice.toString());  

  const ARECIssuanceImage = await deploy('ArkreenRECIssuanceImageLogo', {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
  });

  console.log("ARECIssuanceImageLogo deployed to %s: ", hre.network.name, ARECIssuanceImage.address);
};

// 2024/02/23: Matic testnet:  ArkreenRECIssuanceImageLogo
// yarn deploy:matic_test:ArkreenRECIssuanceImageLogoD
// 0x865a3129677A2d38A85386940F5140Dbb5021efa

// 2024/02/24: Arkreen mainnet launch on Polygon:  ArkreenRECIssuanceImageLogo
// yarn deploy:matic:ArkreenRECIssuanceImageLogoD
// 0x58105aa8Aba5d55B8c0962a1C924827e4CACeeB8

// 2024/04/15: Amoy testnet:  ArkreenRECIssuanceImageLogo
// yarn deploy:matic_test:ArkreenRECIssuanceImageLogoD
// 0x1BdB1555bDc425183ad56FcB31c06205726FEFB0

// 2024/04/20: Deployed on Polygon Amoy testnet 
// yarn deploy:matic_test:ArkreenRECIssuanceImageLogoD
// 0x31ad3b7DC83bc00C321E927dE11AD313eEB9C07e

func.tags = ["ArkreenRECIssuanceImageLogoD"];

export default func;
