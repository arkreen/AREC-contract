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
  }    
  else if(hre.network.name === 'matic_test')  {
    AKREToken_ADDRESS = "0xf2D4C9C2A9018F398b229D812871bf2B316D50E1"
    MANAGER_ADDRESS   = "0xc99b92e8d827aa21cd3ff8fb9576316d90120191"
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

  console.log("Deploying ArkreenMiner...");  
  const ArkreenMinerFactory = await ethers.getContractFactory("ArkreenMiner");
  const ArkreenMiner_Upgrade = await ArkreenMinerFactory.deploy();
  await ArkreenMiner_Upgrade.deployed();
  console.log("New ArkreenMiner deployed to %s:", hre.network.name, ArkreenMiner_Upgrade.address);

  if(hre.network.name === 'goerli') {
    const MINER_PROXY_ADDRESS = "0xc097415d069b37fbeaae14cdda45bb40873cfe33"       // Need to check
    const NEW_IMPLEMENTATION = ArkreenMiner_Upgrade.address

    const [deployer] = await ethers.getSigners();
    const ArkreenMinerFactory = ArkreenMiner__factory.connect(MINER_PROXY_ADDRESS, deployer);

    const callData = ArkreenMinerFactory.interface.encodeFunctionData("postUpdate", 
                                                [AKREToken_ADDRESS as string, MANAGER_ADDRESS as string])
    const updateTx = await ArkreenMinerFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
    await updateTx.wait()

//    console.log("callData, update", callData, updateTx)
//    console.log("ArkreenRegistery deployed to %s: ", hre.network.name, ArkreenMinerFactory.address);
  } 

  if(hre.network.name === 'matic_test') {
    const MINER_PROXY_ADDRESS = "0xb8663edc9929d9135e7f6d50f7d3a97862554a72"       // Need to check
    const NEW_IMPLEMENTATION = ArkreenMiner_Upgrade.address

    const [deployer] = await ethers.getSigners();
    const ArkreenMinerFactory = ArkreenMiner__factory.connect(MINER_PROXY_ADDRESS, deployer);

    const callData = ArkreenMinerFactory.interface.encodeFunctionData("postUpdate", 
                                              [AKREToken_ADDRESS as string, MANAGER_ADDRESS as string])
    const updateTx = await ArkreenMinerFactory.upgradeToAndCall(NEW_IMPLEMENTATION, callData)
    await updateTx.wait()

//    console.log("callData, update", callData, updateTx)
//    console.log("ArkreenRegistery deployed to %s: ", hre.network.name, ArkreenMinerFactory.address);
 } 
};


export default func;
func.tags = ["AMinerU"];


