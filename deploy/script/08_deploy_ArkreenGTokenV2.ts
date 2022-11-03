import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
//import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const gTokenV2 = "ArkreenTokenUpgradeableV2"

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", gTokenV2, deployer);  
    const ArkreenTokenV2 = await deploy(gTokenV2, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenToken deployed to %s: ", hre.network.name, ArkreenTokenV2.address);
};

func.tags = ["gAKREV2"];

export default func;

