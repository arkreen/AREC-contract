import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { CONTRACTS } from "../constants";
import { ArkreenMinerV10__factory } from "../../typechain";

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
    const MINER_PROXY_ADDRESS = "0xC4f795514586275c799729aF5AE7113Bdb7ccc86"       // game miner in matic test net
//  const NEW_IMPLEMENTATION =  "0x4EDe87d416e872376583E793ac26526c535267C5"        // Wrong
    const NEW_IMPLEMENTATION =  "0x7693ad7e3a69b241322094b14fcaec233afb3e56"        // original 
//  const NEW_IMPLEMENTATION =  "0x16a427a1a2012fdde0ccad2664d5f2981d52a2d2"        // restored

    const [deployer] = await ethers.getSigners();
    const ArkreenMinerFactory = ArkreenMinerV10__factory.connect(MINER_PROXY_ADDRESS, deployer);

    console.log("New ArkreenMiner deployed to %s:", hre.network.name, NEW_IMPLEMENTATION);

//  const callData = ArkreenMinerFactory.interface.encodeFunctionData("postUpdate", 
//                                            [AKREToken_ADDRESS as string, MANAGER_ADDRESS as string])
//  const updateTx = await ArkreenMinerFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
    const updateTx = await ArkreenMinerFactory.upgradeTo(NEW_IMPLEMENTATION)
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("Game miner Updated: ", hre.network.name, ArkreenMinerFactory.address);
 } 

  if(hre.network.name === 'matic') {
    const MINER_PROXY_ADDRESS = "0xAc4da3681e51278f82288617c7185a7a119E5b7B"       // Miner Contract in matic mainnet
//  const NEW_IMPLEMENTATION =  "0x8aA572eE9c7991dc059a2Ae18844858B1Eb274F0"       // original 
//  const NEW_IMPLEMENTATION =  "0x2DEe917Da0AF2ed006FEf069Ebf2B558E27c26B5"       // 2023/04/20: Remote miner paid by USDT/MATIC 
    const NEW_IMPLEMENTATION =  "0x8fb18Bb2B2ef751e14BD05d5aaCB5405a6944F8E"       // 2023/04/25: Add native token checking in RemoteMinerOnboardNative

    const [deployer] = await ethers.getSigners();
    const ArkreenMinerFactory = ArkreenMinerV10__factory.connect(MINER_PROXY_ADDRESS, deployer);

    console.log("New ArkreenMiner deployed to %s:", hre.network.name, NEW_IMPLEMENTATION);

//  const callData = ArkreenMinerFactory.interface.encodeFunctionData("postUpdate", 
//                                            [AKREToken_ADDRESS as string, MANAGER_ADDRESS as string])
//  const updateTx = await ArkreenMinerFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
    const updateTx = await ArkreenMinerFactory.upgradeTo(NEW_IMPLEMENTATION)
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("Game miner Updated: ", hre.network.name, ArkreenMinerFactory.address);
  } 
};

// 2023/04/20: yarn deploy:matic:AMinerUV10 
// 2023/04/20: Remote miner paid by USDT/MATIC
// 0x2DEe917Da0AF2ed006FEf069Ebf2B558E27c26B5

// 2023/04/25: yarn deploy:matic:AMinerUV10 
// Add native token checking in RemoteMinerOnboardNative 
// 0x8fb18Bb2B2ef751e14BD05d5aaCB5405a6944F8E

export default func;
func.tags = ["AMinerUV10"];


