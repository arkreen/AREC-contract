import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // Check following address
  let AKREToken_ADDRESS
  let MANAGER_ADDRESS
  let REGISTER_ADDRESS

  if(hre.network.name === 'localhost') {
    AKREToken_ADDRESS = "0xa0cE9DC3d93F4c84aAACd8DA3f66Cd6dA9D5b1F8"
    MANAGER_ADDRESS   = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"
    REGISTER_ADDRESS = "0x58aCE9F0f042bC3DDb1f3d929f32C7931FFdA215"    
  }  else if(hre.network.name === 'goerli')  {
    AKREToken_ADDRESS = "0xf2D4C9C2A9018F398b229D812871bf2B316D50E1"
    MANAGER_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
    REGISTER_ADDRESS = "0x58aCE9F0f042bC3DDb1f3d929f32C7931FFdA215" 
  }    
  else if(hre.network.name === 'matic_test')  {
//    AKREToken_ADDRESS = "0xf2D4C9C2A9018F398b229D812871bf2B316D50E1"
//    MANAGER_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
//    REGISTER_ADDRESS = "0x58aCE9F0f042bC3DDb1f3d929f32C7931FFdA215"
      AKREToken_ADDRESS = "0x54e1c534f59343c56549c76d1bdccc8717129832"
      MANAGER_ADDRESS   = "0x364a71ee7a1c9eb295a4f4850971a1861e9d3c7d"
      REGISTER_ADDRESS  = "0x364a71ee7a1c9eb295a4f4850971a1861e9d3c7d"
  }    

  console.log("Deploying ArkreenMiner...");  

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const ArkreenMiner = await deploy(CONTRACTS.AMiner, {
      from: deployer,
      proxy: {
        proxyContract: "UUPSProxy",
        execute: {
          init: {
            methodName: "initialize",   // Function to call when deployed first time.
            args: [AKREToken_ADDRESS, MANAGER_ADDRESS, REGISTER_ADDRESS]
          },
        },
      },
      log: true,
      skipIfAlreadyDeployed: false,     // do not change
  });

  console.log("ArkreenMiner deployed to %s: ", hre.network.name, ArkreenMiner.address);

};

export default func;
func.tags = ["AMiner"];


