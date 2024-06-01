import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  console.log("Deploying Notary...");  

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(60_000_000_000)

  console.log("Deploying: ", CONTRACTS.Notary, deployer);  
  
  const notaryContract = await deploy(CONTRACTS.Notary, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
  });

  console.log("Notary deployed to %s: ", hre.network.name, notaryContract.address);

};

// 2024/05/30: Remove some checking
// yarn deploy:matic:NotaryD  
// 0xf4D0FA203d34E447c735A94eb6A0E622CE0E975A

export default func;
func.tags = ["NotaryD"];