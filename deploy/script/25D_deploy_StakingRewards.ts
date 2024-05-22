import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(160_000_000_000)

    const stakingRewards = await deploy('StakingRewards', {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });
  
    console.log("USDT deployed to %s: ", hre.network.name, stakingRewards.address);
};

// 2024/05/21: Change RewardAdded event and 1e28 -> 1e36
// yarn deploy:matic_test:StakingRewardsD    : Amoy testnet (Dev Anv)
// Implementaion:         0x4A1276c15821c1ebf76542724E5b81EDe37C7b24

// 2024/05/22: Add: getBasicStakeStatus and getUserStakeStatus
// yarn deploy:matic_test:StakingRewardsD    : Amoy testnet (Dev Anv)
// Implementaion:         0x61A914363Ef99AabCa69504cee5ccfd5523C845d

// 2024/05/22: correct: getUserStakeStatus
// yarn deploy:matic_test:StakingRewardsD    : Amoy testnet (Dev Anv)
// Implementaion:         0x7370c2166D7720c41F0931f0bbF67e10d00B0D18

func.tags = ["StakingRewardsD"];

export default func;
