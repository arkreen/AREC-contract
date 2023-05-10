import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { CONTRACTS } from "../constants";
//import {ArkreenRegistry__factory } from "../../typechain";
//import {HashKeyESGBTC__factory } from "../../typechain";
import {ArkreenRECIssuance__factory } from "../../typechain";

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

/*  
  const IMPLEMENTATION_ADDRESS = "0xb5cd4ef8d470e093b82ae86e5508c17d8c40c4ae"        // implementation address
  const callData = ArkreenRegistry__factory.createInterface().encodeFunctionData("initialize")
//                                            [AKREToken_ADDRESS as string, MANAGER_ADDRESS as string])
*/

/*
  const IMPLEMENTATION_ADDRESS  = "0x16F40BF24E7232056800b0601d6f36121f66ff44"        //2023/3/14: HashKeyESGBTC 
  const BUILDER_ADDRESS         = "0xa05a9677a9216401cf6800d28005b227f7a3cfae"        // ArkreenBuilder address
  const HART_ADDRESS            = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"        // HashKey ART token address
  const NATIVE_ADDRESS          = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"        // WMATIC address
  const NUM_CELL                = 2427

  // 2023/03/14:  0x785dCa2Ca9a51513da1fef9F70E6B6ab02896F67
  const callData = HashKeyESGBTC__factory.createInterface().encodeFunctionData("initialize",        // Create new HashKeyESGBTC
                                      [BUILDER_ADDRESS, HART_ADDRESS, NATIVE_ADDRESS, NUM_CELL])    // 2023/03/14

  console.log("IMPLEMENTATION_ADDRESS, deployer, callData", IMPLEMENTATION_ADDRESS, deployer, callData)

  const UUPSProxyContract = await deploy(CONTRACTS.UUPSProxy, {
      from: deployer,
      args: [IMPLEMENTATION_ADDRESS, deployer, callData],
      log: true,
      skipIfAlreadyDeployed: false,
  });
*/  

  // Proxy of ArkreenIssuance for dev environment
  const IMPLEMENTATION_ADDRESS  = "0x51016EafbC75058391beEea156Ab6B8Ad9B92E52"        // 2023/05/09: ArkreenIssuance Implementation 
  const AKREToken_ADDRESS       = "0x8Ab2299351585097101c91FE4b098d95c18D28a7"        // Arkreen Token
  const REGISTRY_ADDRESS        = "0xfEcbD33525d9B869e5f3CaB895cd6D7A666209ee"        // ArkreenRegistry address
  
  // 2023/05/09:  0x32Dbe18BBc2C752203b6e1bE87EdE5655A091dFa
  const callData = ArkreenRECIssuance__factory.createInterface().encodeFunctionData("initialize",   // Create new ArkreenIssuance
                                      [AKREToken_ADDRESS, REGISTRY_ADDRESS])                        // 2023/05/19
  
  console.log("IMPLEMENTATION_ADDRESS, deployer, callData", IMPLEMENTATION_ADDRESS, deployer, callData)

  const UUPSProxyContract = await deploy(CONTRACTS.UUPSProxy, {
      from: deployer,
      args: [IMPLEMENTATION_ADDRESS, deployer, callData],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("UUPSProxy deployed to %s: ", hre.network.name, UUPSProxyContract.address);

};

// 2023/05/09:  yarn deploy:matic_test:UUPSProxy
// Proxy:   0x32Dbe18BBc2C752203b6e1bE87EdE5655A091dFa

export default func;
func.tags = ["UUPSProxy"];