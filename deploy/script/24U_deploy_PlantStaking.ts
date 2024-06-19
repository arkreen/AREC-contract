import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { CONTRACTS } from "../constants";

import { BigNumber } from "ethers";

import { PlantStaking__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(60_000_000_000)
  
    if(hre.network.name === 'matic_test')  {
      // 2024/05/16: Plant staking on Amoy testnet                        
      const PlantStaking_PROXY_ADDRESS = ""
      const NEW_IMPLEMENTATION = ""
    } else if(hre.network.name === 'matic')  {
      // 2024/06/19:  Plant staking on Polygon mainnet

      const PlantStaking_PROXY_ADDRESS = "0xef3D3Cd3028DDff1fa795CFF8BC42B54a80Ee315"
      const NEW_IMPLEMENTATION = "0x8fC2B041C40077F881A0096768a1805a162b1aAF"

      const [deployer] = await ethers.getSigners();
      const PlantStakingFactory = PlantStaking__factory.connect(PlantStaking_PROXY_ADDRESS, deployer);
      const updateTx = await PlantStakingFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("Update Trx:", updateTx)
      console.log("GreenBTC: ", hre.network.name, PlantStakingFactory.address, NEW_IMPLEMENTATION);

    } 
}

// 2024/06/19
// Polygon mainnet upgrade: reward is changed to be transfer directly from Plantstake contract 
// yarn deploy:matic:PlantStakingU:         0x8fC2B041C40077F881A0096768a1805a162b1aAF

func.tags = ["PlantStakingU"];

export default func;
