import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)
   
    console.log("Deploying: ", "GreenBTC2S", deployer);  

    const greenBTC2S = await deploy('GreenBTC2S', {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
  
    console.log("GreenBTC2S deployed to %s: ", hre.network.name, greenBTC2S.address);
};

// 2024/10/13
// yarn deploy:matic:GreenBTC2SD     : Polygon mainnet: fix the huge gas problem.
// Implementaion:        0xFaCb924cd91EA15CaD4524f52C68b91530288c4d

// 2024/10/14
// yarn deploy:matic:GreenBTC2SD     : Polygon mainnet: fix the huge gas problem.
// Implementaion:        0x7ea0fE45cA251EB7aFe633D70361F7D5548475aB

func.tags = ["GreenBTC2SD"];

export default func;
