import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts,getChainId } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainID = await getChainId()
  const defaultGasPrice = (chainID === '80001') ? BigNumber.from(3_000_000_000) : BigNumber.from(50_000_000_000)

  console.log("Deploying: ", CONTRACTS.GreenBTC, deployer, chainID, defaultGasPrice.toString());  

  const greenBTC = await deploy(CONTRACTS.GreenBTC, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
//    gasPrice: defaultGasPrice
  });

  console.log("greenBTC deployed to %s: ", hre.network.name, greenBTC.address);
};

// 2023/10/24
// yarn deploy:matic_test:GreenBTCD
// Implemenation:   0x17533f8C83eaFbacE7443647Ec9C2326190955Fb

// 2023/10/25
// yarn deploy:matic_test:GreenBTCD:  upgrade luckyRate to be modifiable
// Implemenation:   0x7dbCb85512a9889287b3fD61EDab1fA615D654b8

// 2023/10/25: 2
// yarn deploy:matic_test:GreenBTCD:  upgrade luckyRate to be modifiable
// Implemenation:   0x1DBB6623A6cF8b12bd1FB4A138D7FE11b1ec5f2e

// 2023/10/25: 3
// yarn deploy:matic_test:GreenBTCD:  // upgrade: contrac managed by owner ; 2) Reveal only manager.
// Implemenation:  0x71CfBEAC18B738C5Cc34515C0316495A6CDf7231

// 2023/10/26: :  change beneficiary to minter, greenType is used to flag ART type
// yarn deploy:matic_test:GreenBTCD
// Implemenation:  0xc2f3A5b34D7Ed23297C57597001d82904191454D

// 2023/10/26:2:  Add ART type check, and check minter is not zero
// yarn deploy:matic_test:GreenBTCD
// Implemenation:  0x9a1FC5338303b7E675a9cFfA2050aa7300760b5F

// 2023/10/27 
// yarn deploy:matic_test:GreenBTCD
// Implemenation:  0x1fcf387670f4f4835029ece4acab5cf327bfc005

// 2023/12/4 
// yarn deploy:matic_test:GreenBTCD
// Implemenation:  0xf2F563a63ba82aF85294d8d857dF7e7A22DdaB8B

// 2023/12/5 
// yarn deploy:matic_test:GreenBTCD:  Upgrade for enable pay back config
// Implemenation:  0x5Ae000aee2BFA8CB76f655FdBCdFe3Cb0e727941

// 2024/01/27
// yarn deploy:matic_test:GreenBTCD:  Upgrade to support: Charge offset ART, one badge for batch buying
// Implemenation: 0x331DA2A2E7a92247AFe4A7f96F1bbc7099933527

// 2024/01/30
// yarn deploy:matic_test:GreenBTCD:  Upgrade to skip occupied blocks in batch mode
// Implemenation: 0xcFb70419C26A66dBBF5496987b6a207Bfa4a31A9

// 2024/02/02
// yarn deploy:matic_test:GreenBTCD:  Upgrade to swap the event position of OpenBox and GreenBitCoin
// Implemenation: 0xa806AC934936562a21f568D94610E54E47bb237a

// 2024/02/03
// yarn deploy:matic:GreenBTCD:  Upgrade to support: Charge offset ART, one badge for batch buying
// Implemenation: 0xAC591f8caf3a100b14D4AdD264AB2eE086E5fB09

// 2024/03/06
// yarn deploy:matic:GreenBTCD:  Upgrade to handle OpenList overtimed
// Implemenation: 0xB05EDA9785B7C44Ac5dF78c21c577148cDb865d7

// 2024/03/06A
// yarn deploy:matic:GreenBTCD:  Upgrade to optimize the gas usage of revealBoxes
// Implemenation: 0x859343C2b08fAbAba27A0887852bda7e5724cF6B

// 2024/03/06B
// yarn deploy:matic:GreenBTCD:  Upgrade to optimize the gas usage of deleting big array in storage 
// Implemenation: 0xBC66D05918F79ea139254E662441eCf528360348

// 2024/03/07
// yarn deploy:matic:GreenBTCD:  Upgrade to restore the restore OvertimeBox list
// Implemenation: 0xa4F20c70668ACee2648908c94884d7A8A2A726c6

// 2024/03/08
// yarn deploy:matic:GreenBTCD:  Upgrade to restore the restore OvertimeBox list by updating
// Implemenation: 0xbe02b9b4Eb01d81493f4fb211E0D1F90D0CE37b4

// 2024/03/10
// yarn deploy:matic:GreenBTCD:  Upgrade to support revealcap: overtimeRevealCap, normalRevealCap, removeRevealCap
// Implemenation: 0x81eaB74123513E30Da96aDf4B41b5Ba51d9E650E

// 2024/04/16: Deploy on Amoy testnet
// yarn deploy:matic_test:GreenBTCD
// Implemenation: 0x40E0a167Be5C8427513394914a15E2Be3aCA573d

// 2024/04/28: Deploy on Amoy testnet to change the control of setNewCaps from manager to owner
// yarn deploy:matic_test:GreenBTCD
// Implemenation: 0x160c413f125550c89C7D21FA1C8567986411504E

// 2024/04/28A: Deploy on Amoy testnet to support ART subsidy 
// yarn deploy:matic_test:GreenBTCD
// Implemenation: 0x0635aE3d966FaA129cd0eafc5996bE9a4aB16eD2

// 2024/04/30: Deploy on Polygon mainnet
// yarn deploy:matic:GreenBTCD
// Implemenation: 0x29819D75AeEe53402AB069DEB3B13AF9F8Db9FAf

// 2024/05/09: Deploy on Polygon Amoy: use cART while no subidy, use ART while with subsidy
// yarn deploy:matic_test:GreenBTCD
// Implemenation: 0x6Cb3798C723594cB56BC0a0320BBaBd83756E4FB

// 2024/05/09A: Deploy on Polygon mainnet: use cART while no subidy, use ART while with subsidy
// yarn deploy:matic:GreenBTCD
// Implemenation: 0xf9e8B934db91A80009e24d3CA0Bf3273CDfA079c

// 2024/07/07: Deploy on Polygon mainnet: ratioSubsidyCap is allowed to be 99 at maximum.
// yarn deploy:matic:GreenBTCD
// Implemenation: 0x12c44FF98a175401202569b6B2D0457997ceA8Cd

func.tags = ["GreenBTCD"];

export default func;
