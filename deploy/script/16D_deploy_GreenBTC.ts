import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts,getChainId } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainID = await getChainId()
  const defaultGasfee = (chainID === '80001') ? BigNumber.from(6000000000) : BigNumber.from(50000000000)

  console.log("Deploying: ", CONTRACTS.GreenBTC, deployer, chainID, defaultGasfee.toString());  

  const greenBTC = await deploy(CONTRACTS.GreenBTC, {
      from: deployer,
      args: [],
      log: true,
      skipIfAlreadyDeployed: false,
      gasPrice: defaultGasfee
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
// Implemenation:   

func.tags = ["GreenBTCD"];

export default func;
