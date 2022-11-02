import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  // Check following address
  let AKREToken_ADDRESS
  let MANAGER_ADDRESS

  if(hre.network.name === 'localhost') {
    AKREToken_ADDRESS = "0xa0cE9DC3d93F4c84aAACd8DA3f66Cd6dA9D5b1F8"
    MANAGER_ADDRESS   = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"
  }  else if(hre.network.name === 'rinkeby')  {
    AKREToken_ADDRESS = "0x51ee6bbce004202752bd9083e6c30f6afbc4faf6"
    MANAGER_ADDRESS   = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"
  }    
  else if(hre.network.name === 'matic_test')  {
    AKREToken_ADDRESS = "0xc23Cd0A643CeBA6705b275B40980455792a4c392"
    MANAGER_ADDRESS   = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"
  }    

  console.log("Deploying ArkreenMinerUpgradeable...");  

  const ArkreenMinerUpgradeableFactory = await ethers.getContractFactory("ArkreenMinerUpgradeable")
  const ArkreenMinerUpgradeable = await upgrades.deployProxy(ArkreenMinerUpgradeableFactory,[AKREToken_ADDRESS, MANAGER_ADDRESS])
  await ArkreenMinerUpgradeable.deployed()
  
  console.log("ArkreenMinerUpgradeable deployed to %s: ", hre.network.name, ArkreenMinerUpgradeable.address);

};

export default func;
func.tags = ["gMiner"];
