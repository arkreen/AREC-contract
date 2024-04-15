import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { CONTRACTS } from "../constants";
import { ArkreenMiner__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // Check following address
  let AKREToken_ADDRESS
  let MANAGER_ADDRESS

  if(hre.network.name === 'localhost') {
    AKREToken_ADDRESS = "0xa0cE9DC3d93F4c84aAACd8DA3f66Cd6dA9D5b1F8"
    MANAGER_ADDRESS   = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"
  }  else if(hre.network.name === 'goerli')  {
    AKREToken_ADDRESS = "0xf2D4C9C2A9018F398b229D812871bf2B316D50E1"
    MANAGER_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
  } else if(hre.network.name === 'matic_test')  {
    AKREToken_ADDRESS = "0xf2D4C9C2A9018F398b229D812871bf2B316D50E1"
    MANAGER_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
  } else if(hre.network.name === 'matic')  {
    AKREToken_ADDRESS = "0x960C67B8526E6328b30Ed2c2fAeA0355BEB62A83"
    MANAGER_ADDRESS   = "0x12ba3311431C0f29Ae8B1a57401342373C807D9B"
  }      

  if (AKREToken_ADDRESS === undefined || MANAGER_ADDRESS === undefined) {
    console.log("AKREToken_ADDRESS or MANAGER_ADDRESS not set, Wrong Network Name")
    return
  }

  console.log("Deploying ArkreenMiner...");  
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployerAddress } = await getNamedAccounts();

  console.log("Deploying Updated ArkreenMiner: ", CONTRACTS.AMiner);  
  
/*  
  const ArkreenMiner_Upgrade = await deploy(CONTRACTS.AMiner, {
      from: deployerAddress,
      args: [],
      log: true,
      skipIfAlreadyDeployed: true,
  });
*/

//  const ArkreenMinerFactory = await ethers.getContractFactory("ArkreenMiner");
//  const ArkreenMiner_Upgrade = await ArkreenMinerFactory.deploy();
//  await ArkreenMiner_Upgrade.deployed();

  if(hre.network.name === 'matic_test') {
//  const MINER_PROXY_ADDRESS = "0xC4f795514586275c799729aF5AE7113Bdb7ccc86"       // game miner in matic test net
//  const MINER_PROXY_ADDRESS = "0x682e01f8ecc0524085F51CC7dFB54fDB8729ac22"       // 2023/08/29: Miner in dev env, 2023/08/30, 2023/09/05
    const MINER_PROXY_ADDRESS = "0x1F742C5f32C071A9925431cABb324352C6e99953"       // 2023/08/29: Miner in preduction env, 2023/08/30, 2023/09/05
    
//  const NEW_IMPLEMENTATION =  "0x4EDe87d416e872376583E793ac26526c535267C5"        // Wrong
//  const NEW_IMPLEMENTATION =  "0x7693ad7e3a69b241322094b14fcaec233afb3e56"        // original 
//  const NEW_IMPLEMENTATION =  "0x16a427a1a2012fdde0ccad2664d5f2981d52a2d2"        // restored
//  const NEW_IMPLEMENTATION =  "0xF6c90184eB83a78F184f7bC883721F23519Da067"        // 2023/08/29: Upgrade to support: a) Socket Miner; 2) Batch sale for remote miner;
//  const NEW_IMPLEMENTATION =  "0xFE3423Fb2ef2f1403Cd64a78124ddC1329B6BF00"        // 2023/08/30: Upgrade to sign total value instead price for batch sales
//  const NEW_IMPLEMENTATION =  "0x8aFFe644eD9ae6D9DEC5672cDd927dd8eF29d9EF"        // 2023/09/05: Upgrade to emit back all miner addresses in batch sales
//  const NEW_IMPLEMENTATION =  "0x6661cC0df27111c67CAB8c52B1e21fAbd0354143"        // 2024/01/12: Dev Env: Upgrade to add RemoteMinerOnboardBatchClaim and UpdateMinerWhiteListBatchClaim
//  const NEW_IMPLEMENTATION =  "0xcCfC2109F4997F2c7Da39f1De51620d357EBE471"        // 2024/01/12: Dev Env: Upgrade to add RemoteMinerOnboardBatchClaim and UpdateMinerWhiteListBatchClaim
//  const NEW_IMPLEMENTATION =  "0x7D4718A6430334556c27503A04B3CAf072BA4e29"        // 2024/01/14: Dev Env,  2024/01/15: Pre Env:: Upgrade to add pretection in RemoteMinerOnboardBatchClaim againt replaying signature
//  const NEW_IMPLEMENTATION =  "0x516846704C4e163bF37d97A6870e4b88d5598e46"        // 2024/02/01: Upgrade to support PlantMiner, and block transferring
//  const NEW_IMPLEMENTATION =  "0x8844E2EE618C66383627016EDde27F5A4095B7d2"        // 2024/02/02: Upgrade to correct overlapped parameters
    const NEW_IMPLEMENTATION =  "0x926B113e8fb52EfCeDe65981Fa9ef2731Ab66324"        // 2024/02/02A: Upgrade to correct overlapped parameters

    const [deployer] = await ethers.getSigners();
    const ArkreenMinerFactory = ArkreenMiner__factory.connect(MINER_PROXY_ADDRESS, deployer);

    // 2024/01/12: Dev Env, 2024/01/12B: Dev Env: make parameter public
    // 2024/01/15: Pre Env, Upgrade to add RemoteMinerOnboardBatchClaim and UpdateMinerWhiteListBatchClaim, re-use impl
    // 2024/02/01: Dev Env, 2024/02/01B: Pre-Env: support PlantMiner, and block transferring
    const callData = ArkreenMinerFactory.interface.encodeFunctionData("postUpdate")
    const updateTx = await ArkreenMinerFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)

    // 2024/01/12A: Dev Env, Revert to 0x8aFFe644eD9ae6D9DEC5672cDd927dd8eF29d9EF
    // 2024/01/14: Dev Env: Upgrade to add pretection in RemoteMinerOnboardBatchClaim againt replaying signature
//    const updateTx = await ArkreenMinerFactory.upgradeTo(NEW_IMPLEMENTATION)
//    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("ArkreenMiner Updated to: ", hre.network.name, ArkreenMinerFactory.address, NEW_IMPLEMENTATION);
 } 

  if(hre.network.name === 'matic') {
//  const MINER_PROXY_ADDRESS = "0xAc4da3681e51278f82288617c7185a7a119E5b7B"       // Miner Contract in matic mainnet
//  const NEW_IMPLEMENTATION =  "0x8aA572eE9c7991dc059a2Ae18844858B1Eb274F0"       // original 
//  const NEW_IMPLEMENTATION =  "0x2DEe917Da0AF2ed006FEf069Ebf2B558E27c26B5"       // 2023/04/20: Remote miner paid by USDT/MATIC 
//  const NEW_IMPLEMENTATION =  "0x8fb18Bb2B2ef751e14BD05d5aaCB5405a6944F8E"       // 2023/04/25: Add native token checking in RemoteMinerOnboardNative
    
    const MINER_PROXY_ADDRESS = "0xbf8eF5D950F78eF8edBB8674a48cDACa675831Ae"       // Miner Contract in production env
//  const NEW_IMPLEMENTATION =  "0x7a0Df5eFfdbb91DF24cb7F7dB2500ce9721a7A78"       // 2023/05/10: Original Implementation
//  const NEW_IMPLEMENTATION =  "0x604e10b67736773BD5517fF628e350F443Db85F0"       // 2023/09/12: Upgrade: 1)Socket Miner, 2) Batch sales
//  const NEW_IMPLEMENTATION =  "0x5C3C5f4a3694B89F48D25964070aB68EF82884d4"       // 2024/02/01: Upgrade to support PlantMiner, and block transferring
    const NEW_IMPLEMENTATION =  "0x4bfE8d12b01756A04AB9762D28ebCF4210E9A59B"       // 2024/04/12: Update to correct according audit result and prepare for upgrading on mainnet

    const [deployer] = await ethers.getSigners();
    const ArkreenMinerFactory = ArkreenMiner__factory.connect(MINER_PROXY_ADDRESS, deployer);

    console.log("New ArkreenMiner deployed to %s:", hre.network.name, NEW_IMPLEMENTATION);

//  const callData = ArkreenMinerFactory.interface.encodeFunctionData("postUpdate", 
//                                            [AKREToken_ADDRESS as string, MANAGER_ADDRESS as string])
//  const updateTx = await ArkreenMinerFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)

    // 2024/02/01: Upgrade to support PlantMiner, and block transferring, !!!!!!!!!!!!! call postUpdate
    const callData = ArkreenMinerFactory.interface.encodeFunctionData("postUpdate")

    const upgradeToAndCallData = ArkreenMinerFactory.interface.encodeFunctionData("upgradeToAndCall", [NEW_IMPLEMENTATION, callData])

    //const updateTx = await ArkreenMinerFactory.callStatic['upgradeToAndCall'](NEW_IMPLEMENTATION, callData)

    /*
    const updateTx = await ArkreenMinerFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)

    //const updateTx = await ArkreenMinerFactory.upgradeTo(NEW_IMPLEMENTATION)
    await updateTx.wait()
    */

    console.log("Update Trx:", upgradeToAndCallData)
    console.log("Game miner Updated: ", hre.network.name, ArkreenMinerFactory.address);
  } 
};

// 2023/04/20: yarn deploy:matic:AMinerUV10 
// 2023/04/20: Remote miner paid by USDT/MATIC
// 0x2DEe917Da0AF2ed006FEf069Ebf2B558E27c26B5

// 2023/04/25: yarn deploy:matic:AMinerUV10 
// Add native token checking in RemoteMinerOnboardNative 
// 0x8fb18Bb2B2ef751e14BD05d5aaCB5405a6944F8E

// 2023/08/29: yarn deploy:matic_test:AMinerUV10: For Dev Env. 
// Upgrade to support: a) Socket Miner; 2) Batch sale for remote miner; 
// new immplementaion: 0xF6c90184eB83a78F184f7bC883721F23519Da067

// 2023/08/29: yarn deploy:matic_test:AMinerUV10: For preduction Env. 
// Upgrade to support: a) Socket Miner; 2) Batch sale for remote miner; 
// new immplementaion: 0xF6c90184eB83a78F184f7bC883721F23519Da067

// 2023/08/30: yarn deploy:matic_test:AMinerUV10: For Dev Env. 
// Upgrade to sign total value instead price for batch sales 
// new immplementaion: 0xFE3423Fb2ef2f1403Cd64a78124ddC1329B6BF00

// 2023/08/30: yarn deploy:matic_test:AMinerUV10: For preduction Env. 
// Upgrade to sign total value instead price for batch sales
// new immplementaion: 0xFE3423Fb2ef2f1403Cd64a78124ddC1329B6BF00

// 2023/09/05: yarn deploy:matic_test:AMinerUV10: For Dev Env. 
// Upgrade to emit back all miner addresses in batch sales 
// new immplementaion: 0x8aFFe644eD9ae6D9DEC5672cDd927dd8eF29d9EF

// 2023/09/05: yarn deploy:matic_test:AMinerUV10: For preduction Env. 
// Upgrade to emit back all miner addresses in batch sales
// new immplementaion: 0x8aFFe644eD9ae6D9DEC5672cDd927dd8eF29d9EF

// 2023/09/12: yarn deploy:matic:AMinerUV10: For production Env. 
// Upgrade: 1)Socket Miner, 2) Batch sales
// new immplementaion: 0x604e10b67736773BD5517fF628e350F443Db85F0

// 2024/01/12: yarn deploy:matic_test:AMinerUV10: For Dev Env. 
// Dev Env: Upgrade to add RemoteMinerOnboardBatchClaim and UpdateMinerWhiteListBatchClaim
// new immplementaion: 0x6661cC0df27111c67CAB8c52B1e21fAbd0354143

// 2024/01/12A: yarn deploy:matic_test:AMinerUV10: For Dev Env. 
// Dev Env: Revert to 0x8affe644ed9ae6d9dec5672cdd927dd8ef29d9ef
// immplementaion: 0x8affe644ed9ae6d9dec5672cdd927dd8ef29d9ef

// 2024/01/12B: yarn deploy:matic_test:AMinerUV10: For Dev Env. 
// Dev Env: Revert to 0xcCfC2109F4997F2c7Da39f1De51620d357EBE471
// immplementaion: 0xcCfC2109F4997F2c7Da39f1De51620d357EBE471

// 2024/01/14: yarn deploy:matic_test:AMinerUV10: For Dev Env. 
// Dev Env: Upgrade to add pretection in RemoteMinerOnboardBatchClaim againt replaying signature
// immplementaion: 0x7D4718A6430334556c27503A04B3CAf072BA4e29

// 2024/01/15: yarn deploy:matic_test:AMinerUV10: For pre-production. 
// Dev Env: Upgrade to add RemoteMinerOnboardBatchClaim and UpdateMinerWhiteListBatchClaim, re-use impl 
// immplementaion: 0x7D4718A6430334556c27503A04B3CAf072BA4e29

// 2024/02/01A: yarn deploy:matic_test:AMinerUV10: For Dev Env. 
// Dev Env: Upgrade to support PlantMiner, and block transferring
// immplementaion: 0x516846704C4e163bF37d97A6870e4b88d5598e46

// 2024/02/01B: yarn deploy:matic_test:AMinerUV10: For pre-production Env. 
// Dev Env: Upgrade to support PlantMiner, and block transferring
// immplementaion: 0x516846704C4e163bF37d97A6870e4b88d5598e46

// 2024/02/01C: yarn deploy:matic:AMinerUV10: For production Env. (Need to upgrade with foundation wallet)
// Upgrade to support PlantMiner, and block transferring
// immplementaion: 0x5C3C5f4a3694B89F48D25964070aB68EF82884d4

// 2024/02/02A: yarn deploy:matic_test:AMinerUV10: For Dev Env. 
// Dev Env: Upgrade to correct overlapped parameters
// immplementaion: 0x8844E2EE618C66383627016EDde27F5A4095B7d2

// 2024/02/02B: yarn deploy:matic_test:AMinerUV10: For production Env.
// Upgrade to correct overlapped parameters
// immplementaion: 0x926B113e8fb52EfCeDe65981Fa9ef2731Ab66324

// 2024/04/12: yarn deploy:matic:AMinerUV10: For production Env. (Need to upgrade with foundation wallet)
// Update to correct according audit result and prepare for upgrading on mainnet
// immplementaion: 0x4bfE8d12b01756A04AB9762D28ebCF4210E9A59B

export default func;
func.tags = ["AMinerUV10"];
