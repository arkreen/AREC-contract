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
////// These address are game miner testing ////////////////
//    AKREToken_ADDRESS = "0xf2D4C9C2A9018F398b229D812871bf2B316D50E1"
//    MANAGER_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
//    REGISTER_ADDRESS = "0x58aCE9F0f042bC3DDb1f3d929f32C7931FFdA215"
//////////////////////////////////////////////////////////////

////// These address are for simulation test ////////////////
//    AKREToken_ADDRESS = "0x54e1c534f59343c56549c76d1bdccc8717129832"
//    MANAGER_ADDRESS   = "0x364a71ee7a1c9eb295a4f4850971a1861e9d3c7d"
//    REGISTER_ADDRESS  = "0x364a71ee7a1c9eb295a4f4850971a1861e9d3c7d"
//////////////////////////////////////////////////////////////

////// These address are remote miner testing ////////////////
    AKREToken_ADDRESS = "0x6c28fF02d3A132FE52D022db1f25a33d91caeCA2"
    MANAGER_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
    REGISTER_ADDRESS  = "0x58aCE9F0f042bC3DDb1f3d929f32C7931FFdA215"
//////////////////////////////////////////////////////////////

  } else if(hre.network.name === 'matic')  {
      AKREToken_ADDRESS = "0x960c67b8526e6328b30ed2c2faea0355beb62a83"
      MANAGER_ADDRESS   = "0x12ba3311431C0f29Ae8B1a57401342373C807D9B"
      REGISTER_ADDRESS  = "0x12ba3311431C0f29Ae8B1a57401342373C807D9B" 
  }    

  console.log("Deploying ArkreenMiner...");  

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  /*
  const ArkreenMiner = await deploy(CONTRACTS.AMinerV10, {
      from: deployer,
      proxy: {
        proxyContract: "UUPSProxy",
        execute: {
          init: {
            methodName: "initialize",   // Function to call when deployed first time.
            args: [AKREToken_ADDRESS, MANAGER_ADDRESS, REGISTER_ADDRESS]
          },
          onUpgrade: {
            methodName: "postUpdate", // method to be executed when the proxy is upgraded (not first deployment)
            args: [AKREToken_ADDRESS, MANAGER_ADDRESS],
          },           
        },
      },
      log: true,
      skipIfAlreadyDeployed: false,     // do not change
  });
*/


  console.log("Deploying: ", CONTRACTS.AMinerV10, deployer);  

  /* // Verification is difficult in this deployment mode 
  const ArkreenMinerV10Factory = await ethers.getContractFactory("ArkreenMinerV10");
  const ArkreenMinerV10 = await ArkreenMinerV10Factory.deploy();
  await ArkreenMinerV10.deployed();
  */

  const ArkreenMinerV10 = await deploy(CONTRACTS.AMinerV10, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("ArkreenMiner deployed to %s: ", hre.network.name, ArkreenMinerV10.address);

};

// 2023/04/20: yarn deploy:matic:AMinerV10 
// Add two new ABIs: RemoteMinerOnboardNative and RemoteMinerOnboardApproved 
// 0x2DEe917Da0AF2ed006FEf069Ebf2B558E27c26B5

// 2023/04/25: yarn deploy:matic:AMinerV10D 
// Add native token checking in RemoteMinerOnboardNative 
//  

export default func;
func.tags = ["AMinerV10D"];
