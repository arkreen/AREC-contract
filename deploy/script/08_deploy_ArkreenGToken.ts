import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
//import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const gToken = "ArkreenTokenUpgradeable"

    const FOUNDATION_ADDRESS   = "0x1C9055Db231CD96447c61D07B3cEA77592154C3d"  //from Gery
    const TOTAL_NUMBER = 10000000000

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", gToken, deployer);  
    const ArkreenToken = await deploy(gToken, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: [TOTAL_NUMBER, FOUNDATION_ADDRESS]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenToken deployed to %s: ", hre.network.name, ArkreenToken.address);

    
  
};

func.tags = ["gAKRE"];

export default func;
