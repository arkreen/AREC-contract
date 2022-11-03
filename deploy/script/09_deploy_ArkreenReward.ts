import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
//import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const arkReward = "ArkreenRewardUpgradeable"

     // Need to check and update !!!!!
    const AKRE_TOKEN_ADDRESS   = "0x047eb5205251c5fc8a21ba8f8d46f57df62013c8"  

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", arkReward, deployer);  
    const ArkreenReward = await deploy(arkReward, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: [AKRE_TOKEN_ADDRESS]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenReward deployed to %s: ", hre.network.name, ArkreenReward.address);
};

func.tags = ["arkReward"];

export default func;
