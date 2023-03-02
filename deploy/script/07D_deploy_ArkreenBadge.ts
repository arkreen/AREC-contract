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

func.tags = ["RECBadgeD"];

export default func;
