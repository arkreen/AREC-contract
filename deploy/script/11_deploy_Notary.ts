import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  console.log("Deploying Notary...");  

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(100_000_000_000)

  //const notaryManager = "0x4798a1467b6bf64a50a88dDE001a2CfF55647bee"  // Both for Paranet on testnet and mainnet
  //const notaryManager = "0xE1961bA196BcD66eca6C1338D3Dcc0b0f5140a94"  // For Arkreen Mainnet Launch
  const notaryManager = "0x1AD49E84283E5418175985908459daccD5E60ec8"    // For Amoy testnet dev env 

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
    gasPrice: defaultGasPrice
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

// 2024/02/22: For Arkreen Mainnet Launch
// yarn deploy:matic:Notary  
// Proxy:           0x5cB755DCAAB331B73935c00403729c529ACbeDA9          
// Implementaion:   0xbCD2689802621ED145063bb0d33dd6932531f60d

// 2024/02/22: For Amoy testnet dev env
// yarn deploy:matic_test:Notary  
// Proxy:           0x287Df5Fd8BB1E0109f0aCAc860123D46B918A8e1          
// Implementaion:   0x7d9EADB063BE8561c7724ae1b196e5B372d3f08D

export default func;
func.tags = ["Notary"];