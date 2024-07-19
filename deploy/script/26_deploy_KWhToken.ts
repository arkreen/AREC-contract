import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

import { KWhToken__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(160_000_000_000)

    let tokenART: string = ''
    let artBank: string = ''
    let arkreenBuilder: string = ''
    let offsetManager: string = ''
    
    // function initialize(address art, address bank, address builder, address manager)
    if(hre.network.name === 'matic_test')  {
      // 2024/05/16: AKRE on Amoy testnet                        
      tokenART = "0x615835Cc22064a17df5A3E8AE22F58e67bCcB778"
      artBank = "0xf9aAcFf1B292F82b60662e47610C570ef58d3c70"
      arkreenBuilder = "0x12De6c1FB46B64e3DA5bFDD274E98B9103353dF7"
      offsetManager = "0x364a71ee7a1c9eb295a4f4850971a1861e9d3c7d"
    } else if(hre.network.name === 'matic')  {
      tokenART = "0x58E4D14ccddD1E993e6368A8c5EAa290C95caFDF"
      artBank = "0xab65900A52f1DcB722CaB2e5342bB6b128630A28"
      arkreenBuilder = "0x7073Ea8C9B0612F3C3FE604425E2af7954c4c92e"
      offsetManager = "0x1249B1eABcAE642CF3Cb1e512a0075CEe92769BE"
    } 

    console.log("Deploying: ", "KWhToken", deployer);  
    
    const KWhToken = await deploy("KWhToken", {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",     // Function to call when deployed first time.
              args: [tokenART, artBank, arkreenBuilder, offsetManager]
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
    console.log("USDT deployed to %s: ", hre.network.name, KWhToken.address);
};

// 2024/05/20
// yarn deploy:matic_test:WKH    : Amoy testnet (Dev Anv)
// Proxy:                 0x3B109eA4298870D8dEF8b512444A58Dac909b23f
// Implementaion:         0xa299B0E5E55988b07DEa7eCCfB23BFdd14B1B2b0

// 2024/06/12
// yarn deploy:matic_test:WKH    : Amoy testnet (Dev Anv): support burn ABI
// Proxy:                 0xB932CDD3c6Ad3f39d50278A76fb952A6077d1950 (UUPS)
// Implementaion:         0xd0Bd9950911FdE298a7e4996C7f6D15016177ea0

// 2024/07/14
// yarn deploy:matic:WKH    : Polgon mainnet:
// Proxy:                 0x5740A27990d4AaA4FB83044a6C699D435B9BA6F1
// Implementaion:         0xF727b601d8670D1921985f07d44b0913f1944011

func.tags = ["WKH"];

export default func;
