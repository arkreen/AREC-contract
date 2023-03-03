import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.RECBadge, deployer);  

    const ArkreenBadge = await deploy(CONTRACTS.RECBadge, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenBadge deployed to %s: ", hre.network.name, ArkreenBadge.address);
};

// 2023/02/26: 
// yarn deploy:matic_test:RECBadgeD
// 0xD12E75566CeAa2bA669EDEbBA524359D7564b2c5

// 2023/03/02: 
// yarn deploy:matic_test:RECBadgeD
// 0x619f4a175B17C51cC11e7afB85e50a78b3899900

func.tags = ["RECBadgeD"];

export default func;
