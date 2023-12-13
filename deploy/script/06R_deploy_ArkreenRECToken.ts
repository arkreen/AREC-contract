import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ArkreenRECToken__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", CONTRACTS.RECToken, deployer);  

    if(hre.network.name === 'matic_test') {

      // 2023/3/28: Matic testnet, copy the simu implt of ArkreenRECToken
//    const IMPLEMENTATION_ADDRESS  = "0x19e9BAD19ca2696b509d938476ee4CF823538df4"  // 2023/03/28: Simu implt
//    const REGISTRY_ADDRESS   = "0x61a914363ef99aabca69504cee5ccfd5523c845d"       // 2023/03/28:
//    const ISSUER_ADDRESS     = "0x0AF6Fad1e63De91d5C53Af1dD2e55BB1b278b131"       // 2023/03/28: 
//    const ART_NAME  = 'HashKey AREC Token'
//    const SYMBOL    = 'HART'

      // 2023/05/09: Matic testnet, copy the simu implt of ArkreenRECToken
      // const IMPLEMENTATION_ADDRESS  = "0x19e9BAD19ca2696b509d938476ee4CF823538df4"   // 2023/05/09: Simu implt
      // const REGISTRY_ADDRESS   = "0xfEcbD33525d9B869e5f3CaB895cd6D7A666209ee"        // 2023/05/09:
      // const ISSUER_ADDRESS     = "0xF1CF65Dbfa9cCEe650a053E218F5788F63bDA60E"        // 2023/05/09: 

      // 2023/06/30: Matic testnet, copy the simu implt of ArkreenRECToken
      // const IMPLEMENTATION_ADDRESS  = "0x19e9BAD19ca2696b509d938476ee4CF823538df4"      // 2023/06/08: Simu implt
      // const REGISTRY_ADDRESS   = "0x4590B2d8251963E249967D1fa8122974dE574aC6"           // 2023/06/08:
      // const ISSUER_ADDRESS     = "0x8EEb03d79B08dD763fA549fFA57e5ffF4350B13e"           // 2023/06/08: 
      // const ART_NAME  = ''
      ///const SYMBOL    = ''

      // 2023/12/12: Matic testnet, Depoly hART for Dev env
      // const IMPLEMENTATION_ADDRESS  = "0x0a451317bb231ba332340ef63d7da926f669c614"      // 2023/12/12: Dev deploymnet
      // const REGISTRY_ADDRESS   = "0xfEcbD33525d9B869e5f3CaB895cd6D7A666209ee"           // 2023/12/12:
      // const ISSUER_ADDRESS     = "0x4710E7Fd7A4FBF55ddCcA3105919E2488E5c7D17"           // 2023/12/12: 
      // const ART_NAME  = 'HashKey AREC Token'    // 2023/12/12
      ///const SYMBOL    = 'hART'                  // 2023/12/12

      // 2023/12/12B: Matic testnet, Depoly cART for Dev env: 
      const IMPLEMENTATION_ADDRESS  = "0x0a451317bb231ba332340ef63d7da926f669c614"      // 2023/12/12B: Dev deploymnet
      const REGISTRY_ADDRESS   = "0xfEcbD33525d9B869e5f3CaB895cd6D7A666209ee"           // 2023/12/12B:
      const ISSUER_ADDRESS     = "0x392a051d030629188d60299232C3bFB34b8Af1e6"           // 2023/12/12B: 

      const ART_NAME  = 'Classic Based AREC Token'  // 2023/12/12B
      const SYMBOL    = 'cART'                      // 2023/12/12B

      // 2023/06/08, 2023/12/12, 2023/12/12B
      const callData = ArkreenRECToken__factory.createInterface().encodeFunctionData("initialize", // Create new ArkreenRECToken
                                          [REGISTRY_ADDRESS, ISSUER_ADDRESS, ART_NAME, SYMBOL])    // 2023/05/09 // 2023/06/08, 2023/12/12, 2023/12/12B

      console.log("IMPLEMENTATION_ADDRESS, deployer, callData", IMPLEMENTATION_ADDRESS, deployer, callData)

      const ArkreenRECToken = await deploy(CONTRACTS.UUPSProxy, {
          from: deployer,
          args: [IMPLEMENTATION_ADDRESS, deployer, callData],
          log: true,
          skipIfAlreadyDeployed: false,
      });
      console.log("ArkreenRECToken Proxy is deployed to %s: ", hre.network.name, ArkreenRECToken.address);
  }   
  
  if(hre.network.name === 'matic') {    
/*  
    // 2023/04/04: Matic mainnet, deploy HART based on ART implementation of ArkreenRECToken
      const IMPLEMENTATION_ADDRESS  = "0xfE6B6fe2a965453c2B30f0E2159b346C61DbCA59"  // 2023/04/04: copy ART token
      const REGISTRY_ADDRESS   = "0xb17faCaCA106fB3D216923DB6CaBFC7C0517029d"       // 2023/04/04:
      const ISSUER_ADDRESS     = "0xec9254677d252df0dCaEb067dFC8b4ea5F6edAfC"       // 2023/04/04: same as test version
      const ART_NAME  = 'HashKey AREC Token'
      const SYMBOL    = 'HART'
*/

    // 2023/10/18: Matic mainnet, deploy CART based on ART implementation of ArkreenRECToken
    const IMPLEMENTATION_ADDRESS  = "0xfE6B6fe2a965453c2B30f0E2159b346C61DbCA59"  // 2023/04/04: copy ART token
    const REGISTRY_ADDRESS   = "0xb17faCaCA106fB3D216923DB6CaBFC7C0517029d"       // 2023/04/04:
    const ISSUER_ADDRESS     = "0xaa65582453e121d463A51251E9d8C2BAd27ad99c"       // 2023/10/18
    const ART_NAME  = 'Classic Based AREC Token'
    const SYMBOL    = 'CART'

    const callData = ArkreenRECToken__factory.createInterface().encodeFunctionData("initialize", // Create new Hashkey ArkreenRECToken
                                        [REGISTRY_ADDRESS, ISSUER_ADDRESS, ART_NAME, SYMBOL])    // 2023/10/18

    console.log("IMPLEMENTATION_ADDRESS, deployer, callData", IMPLEMENTATION_ADDRESS, deployer, callData)

    const ArkreenRECToken = await deploy(CONTRACTS.UUPSProxy, {
        from: deployer,
        args: [IMPLEMENTATION_ADDRESS, deployer, callData],
        log: true,
        skipIfAlreadyDeployed: false,
    });
    console.log("ArkreenRECToken Proxy is deployed to %s: ", hre.network.name, ArkreenRECToken.address);
  }
};

// 2023/03/28: Deploy the ArkreenRECToken Proxy based on the simulation implementation
// yarn deploy:matic_test:RECTokenR
// 0x58Ac4e54a70b98960Ed5ecF9B9A2cd1AE83879Db

// 2023/04/04: Deploy the Hashkey ArkreenRECToken Proxy based on the ART implementation
// yarn deploy:matic:RECTokenR
// 0x93b3bb6C51A247a27253c33F0d0C2FF1d4343214

// 2023/05/09: Deploy the ArkreenRECToken Proxy based on the implementation: 0x19e9BAD19ca2696b509d938476ee4CF823538df4
// yarn deploy:matic_test:RECTokenR
// 0x70FdFE7DA492080A8F0233F67C5B48D36d8ceE8b

// 2023/06/08: Deploy the ArkreenRECToken Proxy based on the implementation: 0x19e9BAD19ca2696b509d938476ee4CF823538df4
// for pre-production env
// yarn deploy:matic_test:RECTokenR

// 2023/10/18: Deploy CART token Proxy based on the ART implementation
// yarn deploy:matic:RECTokenR
// 0x0D7899F2D36344ed21829D4EBC49CC0d335B4A06

// 2023/12/12: Deploy the ArkreenRECToken Proxy based on the implementation: 0x0a451317bb231ba332340ef63d7da926f669c614
// for Dev env, HashKey ART token:  
// yarn deploy:matic_test:RECTokenR
// 0xCAABA1AC075Ba045e8C21F9Ae00347EB4FADA3A1

// 2023/12/12B: Deploy the ArkreenRECToken Proxy based on the implementation: 0x0a451317bb231ba332340ef63d7da926f669c614
// for Dev env, cART token:  
// yarn deploy:matic_test:RECTokenR
// 0x9031550a0aE38337a19E4eFA372B3e6b0FE94D3f

func.tags = ["RECTokenR"];

export default func;
