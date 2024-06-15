import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(160_000_000_000)

    const greenBTCGiftImpl = await deploy('GreenBTCGift', {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
  
    console.log("greenBTCGiftImpl is deployed to %s: ", hre.network.name, greenBTCGiftImpl.address);
};

// 2024/06/15
// yarn deploy:matic_test:greenBTCGiftD    : Amoy testnet (Dev Anv): add ABI to change GreenBTC 
// Implementaion:         0x94c0F710C34990772eaDe1818EBF2540fd7106e9

func.tags = ["greenBTCGiftD"];

export default func;
