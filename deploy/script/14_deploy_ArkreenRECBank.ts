import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let NATIVE_ADDRESS

    if(hre.network.name === 'matic_test')  {                                  // Simulation
      NATIVE_ADDRESS    = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"        // WMATIC address
    }
    else if(hre.network.name === 'matic')  {                                  // Matic Mainnet for test
      NATIVE_ADDRESS = ""
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

func.tags = ["ArtBank"];

export default func;
