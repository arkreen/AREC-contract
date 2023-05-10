import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.gRegistry, deployer);  
    const ArkreenRegistry = await deploy(CONTRACTS.gRegistry, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: []
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenRegistry deployed to %s: ", hre.network.name, ArkreenRegistry.address);
};

// 2023/03/22
// yarn deploy:matic:gRegistry
// Proxy:           0xb17facaca106fb3d216923db6cabfc7c0517029d
// Implementation:  0x8c2a6a03b4d2936b029e561acf9ddc502aca72fc

// 2023/05/09
// yarn deploy:matic_test:gRegistry (Dev environment)
// Proxy:          0xfEcbD33525d9B869e5f3CaB895cd6D7A666209ee
// Implementation: 0xb60adb684A682835819a8b4Be2dB6163dEaB393C

func.tags = ["gRegistry"];

export default func;
