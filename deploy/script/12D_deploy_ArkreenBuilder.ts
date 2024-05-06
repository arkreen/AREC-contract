import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", CONTRACTS.ABuilder, deployer);  

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(120_000_000_000)

  const ArkreenBuilder = await deploy(CONTRACTS.ABuilder, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
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

// 2023/12/05: deploy and verification: Overpayemnt payback target address is configed with modeAction
// yarn deploy:matic_test:ABuilderD
// 0x4aF1eADF9f2f51395Fc2329ac0ab554DBb7EBF57

// 2024/01/27: deploy and verification: support UniV3 and Charging offset fee
// yarn deploy:matic_test:ABuilderD
// 0x5054ce5432f3597dAFa90b246253F6433b56e3a9

// 2024/02/03: deploy and verification: support UniV3 and Charging offset fee
// yarn deploy:matic:ABuilderD
// 0x3E458Ff2c39fe10636003e02C1DdA387b455Ee6F

// 2024/04/20: Deployed on Polygon Amoy testnet 
// yarn deploy:matic_test:ABuilderD
// 0x54E1c534F59343C56549C76D1bDccC8717129832

// 2024/05/06: Deployed to support GreenBTC ART discount
// yarn deploy:matic_test:ABuilderD
// 0x93eFC409Ff44788E8b1DAF395F46965046cAe84B

func.tags = ["ABuilderD"];

export default func;
