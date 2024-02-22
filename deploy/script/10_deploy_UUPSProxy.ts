import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { CONTRACTS } from "../constants";
//import { ArkreenRegistry__factory } from "../../typechain";
//import { HashKeyESGBTC__factory } from "../../typechain";
//import { ArkreenRECIssuance__factory } from "../../typechain";
//import { ArkreenMiner__factory } from "../../typechain";
//import { ArkreenBadge__factory } from "../../typechain";
//import { ArkreenBuilder__factory } from "../../typechain";
//import { GreenBTC__factory } from "../../typechain";

import { ArkreenReward__factory } from "../../typechain";

import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  console.log("Deploying UUPSProxy...");  

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying: ", CONTRACTS.UUPSProxy, deployer);  

  const { getChainId } = hre;

  const chainID = await getChainId()
  const defaultGasPrice = (chainID === '80001') ? BigNumber.from(20_000_000_000) : BigNumber.from(100_000_000_000)

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

/*
  // Proxy of ArkreenIssuance for dev environment
  // 2023/05/09
  // const IMPLEMENTATION_ADDRESS  = "0x51016EafbC75058391beEea156Ab6B8Ad9B92E52"        // 2023/05/09: ArkreenIssuance Implementation 
  // const AKREToken_ADDRESS       = "0x8Ab2299351585097101c91FE4b098d95c18D28a7"        // Arkreen Token
  // const REGISTRY_ADDRESS        = "0xfEcbD33525d9B869e5f3CaB895cd6D7A666209ee"        // ArkreenRegistry address

  // Proxy of ArkreenIssuance for pre-production
  // 2023/06/08
  const IMPLEMENTATION_ADDRESS  = "0x51016EafbC75058391beEea156Ab6B8Ad9B92E52"        // 2023/06/08: ArkreenIssuance Implementation 
  const AKREToken_ADDRESS       = "0xc83DEd2B70F25C0EB0ef1cDE993DEaA3fAE91314"        // 2023/06/08: Arkreen Token
  const REGISTRY_ADDRESS        = "0x4590B2d8251963E249967D1fa8122974dE574aC6"        // 2023/06/08: ArkreenRegistry address
  
  // 2023/05/09:  0x32Dbe18BBc2C752203b6e1bE87EdE5655A091dFa
  // 2023/06/08:  0x9745918BAF66e3634502bF9a6C07AD320291D211
  const callData = ArkreenRECIssuance__factory.createInterface().encodeFunctionData("initialize",   // Create new ArkreenIssuance
                                      [AKREToken_ADDRESS, REGISTRY_ADDRESS])                        // 2023/05/09 //2023/06/08
*/

/*
  // Proxy of ArkreenMiner for Open testnet
  // 2023/05/10
  //  const IMPLEMENTATION_ADDRESS  = "0x7a0Df5eFfdbb91DF24cb7F7dB2500ce9721a7A78"    // 2023/05/10: ArkreenIssuance Implementation 

  // 2023/06/08
  const IMPLEMENTATION_ADDRESS  = "0xc7A014f4b823788812A9Cd08D1c819e882b13b89"    // 2023/06/08: Reuse ArkreenMiner Implementation 

  // Open test version
  // 2023/05/10
  // const AKREToken_ADDRESS = "0x21B101f5d61A66037634f7e1BeB5a733d9987D57"
  // const MANAGER_ADDRESS   = "0x78993487b21b8cb8f0442f3ffcb0fc880da34905"
  // const REGISTER_ADDRESS  = "0x78993487b21b8cb8f0442f3ffcb0fc880da34905" 
  // const WMATIC_ADDRESS    = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"          // WMATIC address    

  const AKREToken_ADDRESS = "0xc83DEd2B70F25C0EB0ef1cDE993DEaA3fAE91314"
  const MANAGER_ADDRESS   = "0x42654e7e54b849f4508e158ac6fb416064dc7310"
  const REGISTER_ADDRESS  = "0x42654e7e54b849f4508e158ac6fb416064dc7310" 
  const WMATIC_ADDRESS    = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"          // WMATIC address  
  
  // 2023/05/10:  0xbf8eF5D950F78eF8edBB8674a48cDACa675831Ae
  // 2023/06/08:  0x1F742C5f32C071A9925431cABb324352C6e99953
  const callData = ArkreenMiner__factory.createInterface().encodeFunctionData("initialize",     // Create new ArkreenIssuance
                      [AKREToken_ADDRESS, WMATIC_ADDRESS, MANAGER_ADDRESS, REGISTER_ADDRESS])   // 2023/05/10 // 2023/06/08
*/

/*
  // Proxy of ArkreenRegistry for pre-production
  // 2023/06/08:  0x4590B2d8251963E249967D1fa8122974dE574aC6
  const IMPLEMENTATION_ADDRESS  = "0xb60adb684A682835819a8b4Be2dB6163dEaB393C"    // 2023/06/08: ArkreenRegistry Implementation 
  const callData = ArkreenRegistry__factory.createInterface().encodeFunctionData("initialize")     // Create new ArkreenRegistry
*/

/*
  // Proxy of ArkreenBadge for pre-production
  // 2023/06/08:  
  const IMPLEMENTATION_ADDRESS  = "0xC15de762EB03644ad92d45091E52d840594c6CB2"    // 2023/06/08: ArkreenBadge Implementation 
  const REGISTRY_ADDRESS        = "0x4590B2d8251963E249967D1fa8122974dE574aC6"    // 2023/06/08: ArkreenRegistry address
  
  // 2023/06/08:  0x70A7981b5c9ca1a4250A0C9BBDC2141752deBeeb
  const callData = ArkreenBadge__factory.createInterface().encodeFunctionData("initialize",[REGISTRY_ADDRESS])     // Create new ArkreenBadge

  console.log("IMPLEMENTATION_ADDRESS, deployer, callData", IMPLEMENTATION_ADDRESS, deployer, callData)

  const UUPSProxyContract = await deploy(CONTRACTS.UUPSProxy, {
      from: deployer,
      args: [IMPLEMENTATION_ADDRESS, deployer, callData],
      log: true,
      skipIfAlreadyDeployed: false,
  });
*/

/*
  // Proxy of ArkreenBuilder
  // 2023/12/13: Polygon testnet Dev env 
  const IMPLEMENTATION_ADDRESS  = "0x4aF1eADF9f2f51395Fc2329ac0ab554DBb7EBF57"    // 2023/12/13: ArkreenBuilder Implementation 
  const ROUTER_ADDRESS          = "0x0000000000000000000000000000000000000000"
  const RECBANK_ADDRESS         = "0x9E1DdE2912a804e39E5b19c8B670a6ceE0b1Ca7a"
  const NATIVE_TOKEN_ADDRESS    = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"
  
  // 2023/12/13:  
  const callData = ArkreenBuilder__factory.createInterface().encodeFunctionData("initialize",[ROUTER_ADDRESS, RECBANK_ADDRESS, NATIVE_TOKEN_ADDRESS])     // Create new ArkreenBadge
*/

/*
  // Proxy of GreenBTC
  // 2023/10/23:  
  //const IMPLEMENTATION_ADDRESS  = "0x6240d9780Ac11ccE9A9C269Eb68dFB1eA39eAa05"  // 2023/10/23: GreenBTC Implementation 
  //const IMPLEMENTATION_ADDRESS  = "0x8ca0016B53D16E1712145937C36f009C4f7d493B"    // 2023/10/24: GreenBTC Implementation 

  const IMPLEMENTATION_ADDRESS  = "0x85304b15f0762c0b2752C60e29D04843b17D79c7"    // 2023/10/27: GreenBTC Mainnet 
  
  // Polygon Test net
  // const AUTHORIZER_ADDRESS  = "0x2df522C2bF3E570caA22FBBd06d1A120B4Dc29a8"        // Authorizeried address
  // const BUILDER_ADDRESS     = "0xa05a9677a9216401cf6800d28005b227f7a3cfae"        // ArkreenBuilder address
  // const CART_ADDRESS        = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"        // HashKey ART token address
  // const WMATIC_ADDRESS      = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"        // WMATIC address    

  // Polygon mainnet  
  const AUTHORIZER_ADDRESS  = "0x0dE4fB23694c1532815Ad90fd1689c7234242FE3"        // Authorizeried address
  const BUILDER_ADDRESS     = "0x7073Ea8C9B0612F3C3FE604425E2af7954c4c92e"
  const CART_ADDRESS        = "0x0D7899F2D36344ed21829D4EBC49CC0d335B4A06"
  const WMATIC_ADDRESS      = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"        // WMATIC address 
  
  // 2023/10/23:  0x8cc0b065318acf3ac761fe5a19caf68074034006
  // 
  const callData = GreenBTC__factory.createInterface().encodeFunctionData("initialize", 
                    [AUTHORIZER_ADDRESS, BUILDER_ADDRESS, CART_ADDRESS, WMATIC_ADDRESS])     // Create new GreenBTC

  console.log("IMPLEMENTATION_ADDRESS, deployer, callData", IMPLEMENTATION_ADDRESS, deployer, callData)

  const UUPSProxyContract = await deploy(CONTRACTS.UUPSProxy, {
      from: deployer,
      args: [IMPLEMENTATION_ADDRESS, deployer, callData],
      log: true,
      skipIfAlreadyDeployed: false,
  });
*/

  // Proxy of ArkreenReward
  // 2024/02/22: Polygon Mainnet ArkreenReward
  const IMPLEMENTATION_ADDRESS  = "0xF8b41C01622Ad43148a0DdF844F60dE334d8a119"    // 2024/02/22: ArkreenReward Implementation 
  const AKRE_TOKEN_ADDRESS    = "0xE9c21De62C5C5d0cEAcCe2762bF655AfDcEB7ab3"
  const VALIDATOR_ADDRESS     = "0x1E1A152D1C77A16863e97DAf18E99f85a5F0a605"
  
  // 2024/02/24:  
  const callData = ArkreenReward__factory.createInterface().encodeFunctionData("initialize",[AKRE_TOKEN_ADDRESS, VALIDATOR_ADDRESS])     // Create new ArkreenReward

  console.log("IMPLEMENTATION_ADDRESS, deployer, callData", IMPLEMENTATION_ADDRESS, deployer, callData)

  const UUPSProxyContract = await deploy(CONTRACTS.UUPSProxy, {
      from: deployer,
      args: [IMPLEMENTATION_ADDRESS, deployer, callData],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasPrice
  });

  console.log("UUPSProxy deployed to %s: ", hre.network.name, UUPSProxyContract.address);

};

// 2023/05/09:  yarn deploy:matic_test:UUPSProxy:   ArkreenIssuance
// Proxy:   0x32Dbe18BBc2C752203b6e1bE87EdE5655A091dFa

// 2023/05/10:  yarn deploy:matic:UUPSProxy:   ArkreenMiner
// Proxy:   0xbf8eF5D950F78eF8edBB8674a48cDACa675831Ae

// 2023/06/08:  yarn deploy:matic_test:UUPSProxy:   ArkreenMiner
// Proxy:   0x1F742C5f32C071A9925431cABb324352C6e99953

// 2023/06/08:  yarn deploy:matic_test:UUPSProxy:   ArkreenRegistry
// Proxy:   0x4590B2d8251963E249967D1fa8122974dE574aC6

// 2023/06/08:  yarn deploy:matic_test:UUPSProxy:   ArkreenIssuance
// Proxy:   0x9745918BAF66e3634502bF9a6C07AD320291D211

// 2023/06/08:  yarn deploy:matic_test:UUPSProxy:   ArkreenBadge
// Proxy:   0x70A7981b5c9ca1a4250A0C9BBDC2141752deBeeb

// 2023/10/23:  yarn deploy:matic_test:UUPSProxy:   GreenBTC
// Proxy:   0x8cc0b065318acf3ac761fe5a19caf68074034006

// 2023/10/24:  yarn deploy:matic_test:UUPSProxy:   GreenBTC
// Proxy:   0x770cB90378Cb59665BbF623a72b90f427701C825

// 2023/10/27:  GreenBTC
// yarn deploy:matic:UUPSProxy
// Proxy:   0xDf51F3DCD849f116948A5B23760B1ca0B5425BdE

// 2023/12/13:  ArkreenBuilder
// yarn deploy:matic_test:UUPSProxy
// Proxy:   0xC88535788B4e45966c529D8b3FAd027d1E2d5a0a

// 2024/02/22:  ArkreenReward
// yarn deploy:matic:UUPSProxy
// Proxy:   0xDcF10d429c0422Af80790bC810A33189771D643d


export default func;
func.tags = ["UUPSProxy"];