import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let NATIVE_ADDRESS

    if(hre.network.name === 'matic_test')  {                                  // Simulation
      NATIVE_ADDRESS    = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"        // WMATIC address
    }
    else if(hre.network.name === 'matic')  {                                  // Matic Mainnet for test
      NATIVE_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"           // WMATIC
    } 

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.ArtBank, deployer);  
    const arkreenRECBank = await deploy(CONTRACTS.ArtBank, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",                   // Function to call when deployed first time.
              args: [NATIVE_ADDRESS]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });


    console.log("ArkreenRECBank deployed to %s: ", hre.network.name, arkreenRECBank.address);
};

// 2023/03/14
// yarn deploy:matic_test:ArtBank
// Proxy:           0x7ee6D2A14d6Db71339a010d44793B27895B36d50
// Implementation:  0xCdacE7DB767e77BD938e488925B6b00f98D4063C

// 2023/04/04
// yarn deploy:matic:ArtBank
// Proxy:           0xab65900A52f1DcB722CaB2e5342bB6b128630A28
// Implementation:  0x4142668D4B26c643266F1787dB542535E13aCC52

func.tags = ["ArtBank"];

export default func;
