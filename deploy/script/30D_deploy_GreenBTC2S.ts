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

// 2024/10/14
// yarn deploy:matic_test:GreenBTC2SD   : Amoy testnet: fix the huge gas problem and makeGreenBoxLucky is added.
// Implementaion:        0xA649E9B886d2A1A1713268Ef6BC05E89A22a5436

// 2024/10/16
// yarn deploy:matic_test:GreenBTC2SD   : Amoy testnet: support multiple seed mode
// Implementaion:        0x9ab6a15F421FA92eE8111cD096dc37C7859Cb4c9

// 2024/10/23
// yarn deploy:matic:GreenBTC2SD     : Polygon mainnet: support multiple seed mode
// Implementaion:        0xa7181d53d4451973Adf130eB5a56DdA7C41B4b3D

// 2024/11/06
// yarn deploy:matic_test:GreenBTC2SD   : Amoy testnet: DomainGreenizedLucky changed
// Implementaion:        0xb6505E881680a45eCb0469dd8BB4b39a85105a3a

func.tags = ["GreenBTC2SD"];

export default func;
