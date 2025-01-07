import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)
   
    console.log("Deploying: ", "RwaCSP", deployer);  

    const rwaAssetPro = await deploy('RwaCSP', {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
  
    console.log("arkreenPromotion deployed to %s: ", hre.network.name, rwaAssetPro.address);
};

// 2025/01/07
// yarn deploy:matic_test:RwaCSPD   : Amoy testnet
// Implementaion:        0x7AE7C5CF040C2DFB08530306F72B1BFecfF72138

func.tags = ["RwaCSPD"];

export default func;
