import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(200_000_000_000)
    
    console.log("Deploying: ", "UniTool", deployer);  

    const uniTool = await deploy('UniTool', {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false
//        gasPrice: defaultGasPrice
    });
  
    console.log("greenPower deployed to %s: ", hre.network.name, uniTool.address);
};


// 2024/07/31
// yarn deploy:matic:UniToolD
// Implementaion:         0x97A49D1E92Ce71477e8AAEcE475006d2d6503EC6

// 2024/08/3
// yarn deploy:matic:UniToolD: convert to price
// Implementaion:         0x587a7CE0feDeA409eBC2188dd6B547017f459217

// 2024/08/5
// yarn deploy:matic:UniToolD: Fix price converting
// Implementaion:         0x3064d874A1a2e522eC936513c21d19358ABB3D31


func.tags = ["UniToolD"];

export default func;
