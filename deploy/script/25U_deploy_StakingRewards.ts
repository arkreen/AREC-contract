import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { GreenBTC__factory } from "../../typechain";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const { getChainId } = hre;

  const chainID = await getChainId()
  const defaultGasPrice = (chainID === '80001') ? BigNumber.from(3_000_000_000) : BigNumber.from(50_000_000_000)
  
  if(hre.network.name === 'matic_test') {

    const STAKE_REWARD_PROXY_ADDRESS  = "0x691938a6e88a85E66Aab05ECf84Fe84ECE8351C9"  // 2024/05/16: StakingRewards on Amoy testnet
    // const NEW_IMPLEMENTATION       = "0x4A1276c15821c1ebf76542724E5b81EDe37C7b24"  // 2024/05/21: Change RewardAdded event
    //const NEW_IMPLEMENTATION        = "0x61A914363Ef99AabCa69504cee5ccfd5523C845d"  // 2024/05/22: Add getBasicStakeStatus and getUserStakeStatus
    const NEW_IMPLEMENTATION          = "0x7370c2166D7720c41F0931f0bbF67e10d00B0D18"  // 2024/05/22: Correct getUserStakeStatus

    console.log("Updating StakingRewards: ", STAKE_REWARD_PROXY_ADDRESS, chainID, defaultGasPrice.toString());  

    const [deployer] = await ethers.getSigners();
    const GreenBTCFactory = GreenBTC__factory.connect(STAKE_REWARD_PROXY_ADDRESS, deployer);
    const updateTx = await GreenBTCFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
    await updateTx.wait()

    console.log("Upgrading StakingRewards is executed: %s: ", hre.network.name, NEW_IMPLEMENTATION);
  } 

  if(hre.network.name === 'matic') {
    const STAKE_REWARD_PROXY_ADDRESS  = ""  
    const NEW_IMPLEMENTATION      = ""     
  } 
};

// 2024/05/21: Upgrade on Amoy mainet to Change RewardAdded event
// yarn deploy:matic_test:StakingRewardsU: 0x4A1276c15821c1ebf76542724E5b81EDe37C7b24

// 2024/05/22: Add getBasicStakeStatus and getUserStakeStatus
// yarn deploy:matic_test:StakingRewardsU: 0x61A914363Ef99AabCa69504cee5ccfd5523C845d

// 2024/05/22A: Correct getUserStakeStatus
// yarn deploy:matic_test:StakingRewardsU: 0x7370c2166D7720c41F0931f0bbF67e10d00B0D18

export default func;
func.tags = ["StakingRewardsU"];