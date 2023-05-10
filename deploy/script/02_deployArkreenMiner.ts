import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // Check following address
  let AKREToken_ADDRESS
  let MANAGER_ADDRESS
  let REGISTER_ADDRESS
  let WMATIC_ADDRESS

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
//  AKREToken_ADDRESS = "0x6c28fF02d3A132FE52D022db1f25a33d91caeCA2"
//  MANAGER_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
//  REGISTER_ADDRESS  = "0x58aCE9F0f042bC3DDb1f3d929f32C7931FFdA215"

    AKREToken_ADDRESS = "0x8Ab2299351585097101c91FE4b098d95c18D28a7"
    MANAGER_ADDRESS   = "0xdc641760adAe486Ba9c9878C1f3831c26EbFEAaa"
    REGISTER_ADDRESS  = "0xdc641760adAe486Ba9c9878C1f3831c26EbFEAaa"
    WMATIC_ADDRESS    = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"            // WMATIC address


//////////////////////////////////////////////////////////////

  } else if(hre.network.name === 'matic')  {
      // Internal UX version
//      AKREToken_ADDRESS = "0x960c67b8526e6328b30ed2c2faea0355beb62a83"
//      MANAGER_ADDRESS   = "0x12ba3311431C0f29Ae8B1a57401342373C807D9B"
//      REGISTER_ADDRESS  = "0x12ba3311431C0f29Ae8B1a57401342373C807D9B" 
//      WMATIC_ADDRESS    = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"          // WMATIC address      

      // Open test version
      AKREToken_ADDRESS = "0x21B101f5d61A66037634f7e1BeB5a733d9987D57"
      MANAGER_ADDRESS   = "0x78993487b21b8cb8f0442f3ffcb0fc880da34905"
      REGISTER_ADDRESS  = "0x78993487b21b8cb8f0442f3ffcb0fc880da34905" 
      WMATIC_ADDRESS    = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"          // WMATIC address      
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
            args: [AKREToken_ADDRESS, WMATIC_ADDRESS, MANAGER_ADDRESS, REGISTER_ADDRESS]
          },
        },
      },
      log: true,
      skipIfAlreadyDeployed: false,     // do not change
  });

  console.log("ArkreenMiner deployed to %s: ", hre.network.name, ArkreenMiner.address);

//  console.log("Deploying: ", CONTRACTS.AMiner, deployer);  

  /* // Verification is difficult in this deployment mode 
  const ArkreenMinerV10Factory = await ethers.getContractFactory("ArkreenMinerV10");
  const ArkreenMinerV10 = await ArkreenMinerV10Factory.deploy();
  await ArkreenMinerV10.deployed();
  */

  /*
  const ArkreenMinerV10 = await deploy(CONTRACTS.AMiner, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("ArkreenMiner deployed to %s: ", hre.network.name, ArkreenMinerV10.address);
*/

};

// 2023/04/20: yarn deploy:matic:AMinerV10 
// Add two new ABIs: RemoteMinerOnboardNative and RemoteMinerOnboardApproved 
// 0x2DEe917Da0AF2ed006FEf069Ebf2B558E27c26B5

// 2023/04/28: yarn deploy:matic_test:AMinerV10 
// Deployed in Polygon test for delvelopment environment
// 0xC329FeB90E42B42731Fe60CaD43873f02027499A

// 2023/04/30: yarn deploy:matic_test:AMiner 
// Deployed in Polygon test for delvelopment environment after removing Gaming miner
// Proxy: 0x682e01f8ecc0524085F51CC7dFB54fDB8729ac22
// Implementation: 0xc7A014f4b823788812A9Cd08D1c819e882b13b89

// 2023/05/09: yarn deploy:matic:AMiner 
// Deployed in Polygon mainnet for Open Testnet after removing Gaming miner
// Proxy:           failed for low value
// Implementation:  0x7a0Df5eFfdbb91DF24cb7F7dB2500ce9721a7A78


export default func;
func.tags = ["AMiner"];
