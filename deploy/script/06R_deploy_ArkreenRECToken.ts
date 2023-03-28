import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ArkreenRECToken__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.RECToken, deployer);  

    // 2023/3/28: Matic testnet, copy the simu implt of ArkreenRECToken
    const IMPLEMENTATION_ADDRESS  = "0x19e9BAD19ca2696b509d938476ee4CF823538df4"  // 2023/03/28: Simu implt
    const REGISTRY_ADDRESS   = "0x61a914363ef99aabca69504cee5ccfd5523c845d"       // 2023/03/28:
    const ISSUER_ADDRESS     = "0x0AF6Fad1e63De91d5C53Af1dD2e55BB1b278b131"       // 2023/03/28: 
    const ART_NAME  = 'HashKey AREC Token'
    const SYMBOL    = 'HART'

  const callData = ArkreenRECToken__factory.createInterface().encodeFunctionData("initialize", // Create new ArkreenRECToken
                                      [REGISTRY_ADDRESS, ISSUER_ADDRESS, ART_NAME, SYMBOL])    // 2023/03/28

  console.log("IMPLEMENTATION_ADDRESS, deployer, callData", IMPLEMENTATION_ADDRESS, deployer, callData)

  const ArkreenRECToken = await deploy(CONTRACTS.UUPSProxy, {
      from: deployer,
      args: [IMPLEMENTATION_ADDRESS, deployer, callData],
      log: true,
      skipIfAlreadyDeployed: false,
  });

  console.log("ArkreenRECToken Proxy is deployed to %s: ", hre.network.name, ArkreenRECToken.address);
};

// 2023/03/28: Deploy the ArkreenRECToken Proxy based on the simulation implementation
// yarn deploy:matic_test:RECTokenR
// 0x58Ac4e54a70b98960Ed5ecF9B9A2cd1AE83879Db

func.tags = ["RECTokenR"];

export default func;
