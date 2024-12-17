import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)
   
    console.log("Deploying: ", "ArkreenPromotion", deployer);  

    const arkreenPromotion = await deploy('ArkreenPromotion', {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
  
    console.log("arkreenPromotion deployed to %s: ", hre.network.name, arkreenPromotion.address);
};

// 2024/12/17
// yarn deploy:matic_test:ArkreenPromotionD   : Amoy testnet: fix bug
// Implementaion:        0xBB17d9b933F631024cA4cF45391E7302CD527489

// 2024/12/17
// yarn deploy:matic_test:ArkreenPromotionD   : Amoy testnet: getPromotionConfig and getPromotionUserStatus
// Implementaion:        0xC88535788B4e45966c529D8b3FAd027d1E2d5a0a

// 2024/12/17
// yarn deploy:matic_test:ArkreenPromotionD   : Amoy testnet: add calling RemoteMinerOnboardAuthority to Miner Contract
// Implementaion:        0xC88535788B4e45966c529D8b3FAd027d1E2d5a0a

func.tags = ["ArkreenPromotionD"];

export default func;
