import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { CONTRACTS } from "../constants";
import {ArkreenRegistry__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  console.log("Deploying UUPSProxy...");  

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", CONTRACTS.UUPSProxy, deployer);  

  /* // Verification is difficult in this deployment mode 
  const ArkreenMinerV10Factory = await ethers.getContractFactory("ArkreenMinerV10");
  const ArkreenMinerV10 = await ArkreenMinerV10Factory.deploy();
  await ArkreenMinerV10.deployed();
  */
  const IMPLEMENTATION_ADDRESS = "0xb5cd4ef8d470e093b82ae86e5508c17d8c40c4ae"        // implementation address

  const callData = ArkreenRegistry__factory.createInterface().encodeFunctionData("initialize")
//                                            [AKREToken_ADDRESS as string, MANAGER_ADDRESS as string])

  console.log("IMPLEMENTATION_ADDRESS, deployer, callData", IMPLEMENTATION_ADDRESS, deployer, callData)

  const UUPSProxyContract = await deploy(CONTRACTS.UUPSProxy, {
      from: deployer,
      args: [IMPLEMENTATION_ADDRESS, deployer, callData],
      log: true,
      skipIfAlreadyDeployed: false,
  });
  
  console.log("UUPSProxy deployed to %s: ", hre.network.name, UUPSProxyContract.address);

};

export default func;
func.tags = ["UUPSProxy"];