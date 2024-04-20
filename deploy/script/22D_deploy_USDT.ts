import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

// import { expandTo18Decimals } from "../../test/utils/utilities";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(300_000_000_000)
    
    const USDT = await deploy("UChildERC20", {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });

    console.log("USDT deployed to %s: ", hre.network.name, USDT.address);
    
};

// 2024/04/20: deploy AKRE for verification
// yarn deploy:matic_test:ARKED
// Implementation:  0x1b6209dFb258ba757066CC8BDa987d592962b375

// 2024/04/20: Deployed on Polygon Amoy testnet 
// yarn deploy:matic_test:ARKED
// Implementation:  0x7fE67CC6cF3653A365F2F1c7Be5E804a389A9103

func.tags = ["ARKED"];

export default func;
