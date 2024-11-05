import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)
   
    console.log("Deploying: ", "MinerStaking", deployer);  

    const minerStaking = await deploy('MinerStaking', {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
  
    console.log("MinerStaking deployed to %s: ", hre.network.name, minerStaking.address);
};


// 2024/10/18
// yarn deploy:matic_test:MinerStakingD   : Amoy testnet: add deadline in slash
// Implementaion:        0x4400813481fDcd24578f25780b0057326dD47879

// 2024/11/5
// yarn deploy:matic_test:MinerStakingD   : Amoy testnet: change stakingToken
// Implementaion:        0xE528D9359e2B853a5963B0DD614499c12A83b2Ae

// 2024/11/5B
// yarn deploy:matic_test:MinerStakingD   : Amoy testnet: change stakingToken to be Owner controlled
// Implementaion:        0x93055D0c3c43561D7889C9dE196f7EE6f1cd0e77

func.tags = ["MinerStakingD"];

export default func;
