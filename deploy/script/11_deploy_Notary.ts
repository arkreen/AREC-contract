import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  console.log("Deploying Notary...");  

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", CONTRACTS.Notary, deployer);  
  
  const NotaryContract = await deploy(CONTRACTS.Notary, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });
  
  console.log("Notary deployed to %s: ", hre.network.name, NotaryContract.address);

};

export default func;
func.tags = ["Notary"];