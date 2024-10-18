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

func.tags = ["MinerStakingD"];

export default func;
