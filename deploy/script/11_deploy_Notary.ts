import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  console.log("Deploying Notary...");  

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const notaryManager = "0x4798a1467b6bf64a50a88dDE001a2CfF55647bee"  // Both for Paranet on testnet and mainnet

  console.log("Deploying: ", CONTRACTS.Notary, deployer, notaryManager);  
  
  const NotaryContract = await deploy(CONTRACTS.Notary, {
    from: deployer,
    proxy: {
      proxyContract: "UUPSProxy",
      execute: {
        init: {
          methodName: "initialize",     // Function to call when deployed first time.
          args: [notaryManager]
        },
      },
    },
    log: true,
    skipIfAlreadyDeployed: true,
});
  
  console.log("Notary deployed to %s: ", hre.network.name, NotaryContract.address);

};

// 2023/12/26: Paranet on testnet
// yarn deploy:matic_test:Notary  
// Proxy:           0xfb11eAeE8330d417879167fED3F61d8194e07891          
// Implementaion:   0xfA99FD9C58AF9dCBCe4019c0F5227b7263a31C08

// 2023/12/29: Paranet on mainet
// yarn deploy:matic:Notary  
// Proxy:           0x2d22fa4337A8a17ba0587a01dADAbeB3FFEa0983          
// Implementaion:   0x309777BAEd1D135eF50759D6580d1A9E314427C1

export default func;
func.tags = ["Notary"];