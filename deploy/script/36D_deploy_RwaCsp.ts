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

// 2024/12/23
// yarn deploy:matic_test:RwaCSPD   : Amoy testnet
// Implementaion:        0x23810C3553dF852242D415f89a512A6015b3EA89

func.tags = ["RwaCSPD"];

export default func;
