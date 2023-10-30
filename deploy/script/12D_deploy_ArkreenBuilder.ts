import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", CONTRACTS.ABuilder, deployer);  

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(6000000000) : BigNumber.from(120000000000)

  const ArkreenBuilder = await deploy(CONTRACTS.ABuilder, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice,
      nonce: 150,
  });

  console.log("ArkreenBuilder deployed to %s: ", hre.network.name, ArkreenBuilder.address);
};

// 2023/03/14
// yarn deploy:matic_test:ABuilderD
// 0x16dB479F500aeE6C1683955e0E34394fe81Be12d

// 2023/10/11: deploy and verification
// yarn deploy:matic_test:ABuilderD
// 0xd320E323293d092d3dcC3533AF477cD14976C31B

// 2023/10/30: deploy and verification on polygon mainnet
// yarn deploy:matic:ABuilderD
// 0x076bB3051f273Ea6f6AA76e41797241124B3B157

func.tags = ["ABuilderD"];

export default func;
