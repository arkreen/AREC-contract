import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { CONTRACTS } from "../constants";

import { BigNumber } from "ethers";

import { PlantStaking__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(60_000_000_000)
  
    if(hre.network.name === 'matic_test')  {
      // 2024/08/12: Plant staking on Amoy testnet                        
      const PlantStaking_PROXY_ADDRESS = "0xc585886B2A3E8a177351cB47754c7295C3C49922"
      const NEW_IMPLEMENTATION = "0x4590B2d8251963E249967D1fa8122974dE574aC6"

      const [deployer] = await ethers.getSigners();
      const PlantStakingFactory = PlantStaking__factory.connect(PlantStaking_PROXY_ADDRESS, deployer);
      const updateTx = await PlantStakingFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("Update Trx:", updateTx)
      console.log("PlantStakingFactory: ", hre.network.name, PlantStakingFactory.address, NEW_IMPLEMENTATION);

    } else if(hre.network.name === 'matic')  {
      // 2024/06/19:  Plant staking on Polygon mainnet

      const PlantStaking_PROXY_ADDRESS = "0xef3D3Cd3028DDff1fa795CFF8BC42B54a80Ee315"
      const NEW_IMPLEMENTATION = "0x8fC2B041C40077F881A0096768a1805a162b1aAF"

      const [deployer] = await ethers.getSigners();
      const PlantStakingFactory = PlantStaking__factory.connect(PlantStaking_PROXY_ADDRESS, deployer);
      const updateTx = await PlantStakingFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
      await updateTx.wait()
  
      console.log("Update Trx:", updateTx)
      console.log("PlantStakingFactory: ", hre.network.name, PlantStakingFactory.address, NEW_IMPLEMENTATION);

    } 
}

// 2024/06/19
// Polygon mainnet upgrade: reward is changed to be transfer directly from Plantstake contract 
// yarn deploy:matic:PlantStakingU:         0x8fC2B041C40077F881A0096768a1805a162b1aAF

// 2024/08/12
// Amoy testnet upgrade: reward is changed to be transfer directly from Plantstake contract, and stakeSlash is added
// yarn deploy:matic_test:PlantStakingU:         0x4590B2d8251963E249967D1fa8122974dE574aC6

func.tags = ["PlantStakingU"];

export default func;
