import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(320_000_000_000)

    const kWhTokenImpl = await deploy('KWhToken', {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
  
    console.log("kWhTokenImpl is deployed to %s: ", hre.network.name, kWhTokenImpl.address);
};

// 2024/12/25
// yarn deploy:matic:WKHD    : Polygon mainnet: Add ABI to remvove ART
// Implementaion:         0x399b885E8428ADa05945Ac5f28FAfac5Cc036BCA

func.tags = ["WKHD"];

export default func;
