import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)
    
    console.log("Deploying: ", "UniTool", deployer);  

    const uniTool = await deploy('UniTool', {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
  
    console.log("greenPower deployed to %s: ", hre.network.name, uniTool.address);
};


// 2024/07/31
// yarn deploy:matic:UniToolD
// Implementaion:         0x97A49D1E92Ce71477e8AAEcE475006d2d6503EC6

// 2024/08/3
// yarn deploy:matic:UniToolD: convert to price
// Implementaion:         0x97A49D1E92Ce71477e8AAEcE475006d2d6503EC6

func.tags = ["UniToolD"];

export default func;
