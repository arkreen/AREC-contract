import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { CONTRACTS } from "../constants";

import { BigNumber } from "ethers";

import { PlantStaking__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(50_000_000_000)
   
    const plantStaking = await deploy("PlantStaking", {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
  
    console.log("PlantStaking deployed to %s: ", hre.network.name, plantStaking.address);
};

// 2024/06/19
// yarn deploy:matic:PlantStakingD    : Polygon mainnet, reward is changed to be transfer directly from Plantstake contract 
// 0x8fC2B041C40077F881A0096768a1805a162b1aAF

func.tags = ["PlantStakingD"];

export default func;
