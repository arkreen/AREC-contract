import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

import { GreenBTCGift__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(160_000_000_000)

    let gbtc : string = ''
    let akre: string = ''
    
    //function initialize(address gbtc, address akre)
    if(hre.network.name === 'matic_test')  {
      // 2024/06/12: GreenBTCV2 on Amoy testnet                        
      gbtc = "0x20E45e53B813788C2D169D3D861A4C0Ae3bDD4eA"
      akre = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"
    } else if(hre.network.name === 'matic')  {
      gbtc = ""
      akre = ""
    } 

    console.log("Deploying: ", "GreenBTCGift", deployer);  
    
    // function initialize(address akre, address kWh, address _manager)
    const greenBTCGift = await deploy("GreenBTCGift", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [gbtc, akre]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });

    /*
    // 2024/06/04
    const IMPLEMENTATION_ADDRESS ="0xd0Bd9950911FdE298a7e4996C7f6D15016177ea0"
    
    const callData = KWhToken__factory.createInterface().encodeFunctionData("initialize", [tokenART, artBank, arkreenBuilder, offsetManager])
    const KWhToken = await deploy(CONTRACTS.UUPSProxy, {
            from: deployer,
            args: [IMPLEMENTATION_ADDRESS, deployer, callData],
            log: true,
            skipIfAlreadyDeployed: false,
            gasPrice: defaultGasPrice
    });
    */

    console.log("USDT deployed to %s: ", hre.network.name, greenBTCGift.address);
};

// 2024/06/12
// yarn deploy:matic_test:greenBTCGift    : Amoy testnet (Dev Anv)
// Proxy:                 0x644d45543027E72Ecb653732c1363584710FF609
// Implementaion:         0x0Aa406Fb5B95E884bE90b4b547bBD795C8Fe4357

func.tags = ["greenBTCGift"];

export default func;
