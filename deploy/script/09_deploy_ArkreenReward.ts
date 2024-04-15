import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
//import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(100_000_000_000)

    const arkReward = "ArkreenReward"

    // Need to check and update !!!!!
//  const AKRE_TOKEN_ADDRESS    = "0x960c67b8526e6328b30ed2c2faea0355beb62a83"  
//  const VALIDATOR_ADDRESS     = "0x25C3f0Ea82E318b3488adfB3f4cbE76b49508B1c"  

    // 2023/05/16: Open testnet
//    const AKRE_TOKEN_ADDRESS    = "0x21B101f5d61A66037634f7e1BeB5a733d9987D57"
//    const VALIDATOR_ADDRESS     = "0x741e2403b63a41188e72dc3897d730a746d9181e"

/*
    // 2023/12/26: Paranet on Testnet
    const AKRE_TOKEN_ADDRESS    = "0xbc9de41189F76519e8Aa43157F2D4faf305458da"
    const VALIDATOR_ADDRESS     = "0xF013aC5bF29Fc3DcAd2f89510eCfAeca79d5042e"
*/

/*
    // 2023/12/29: Paranet on mainnet
    const AKRE_TOKEN_ADDRESS    = "0x990393E7540883260BBEBf1960C77b78Ad5F0146"
    const VALIDATOR_ADDRESS     = "0xF013aC5bF29Fc3DcAd2f89510eCfAeca79d5042e"
*/

/*
    // 2024/02/22: Arkreen Mainnet Launch on Polygon mainnet
    const AKRE_TOKEN_ADDRESS    = "0xE9c21De62C5C5d0cEAcCe2762bF655AfDcEB7ab3"
    const VALIDATOR_ADDRESS     = "0x1E1A152D1C77A16863e97DAf18E99f85a5F0a605"
*/

    // 2024/04/15: Polygon amoy testnet 
    const AKRE_TOKEN_ADDRESS    = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"
    const VALIDATOR_ADDRESS     = "0x8C4D62477F70C7Ea628B52dbF37DcC2E5e4043E2"

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deploying: ", arkReward, deployer);  
    const ArkreenReward = await deploy(arkReward, {
        from: deployer,
        proxy: {
          proxyContract: "UUPSProxy",
          execute: {
            init: {
              methodName: "initialize",   // Function to call when deployed first time.
              args: [AKRE_TOKEN_ADDRESS, VALIDATOR_ADDRESS]
            },
          },
        },
        log: true,
        skipIfAlreadyDeployed: false,
        gasPrice: defaultGasPrice
    });

    console.log("ArkreenReward deployed to %s: ", hre.network.name, ArkreenReward.address);
};

// 2023/05/16: Open testnet
// yarn deploy:matic:arkReward  
// Proxy:           0x44082E783bA0aBB62975e77E48aF355B2bF3d440         
// Implementaion:   0x2f47c3346300ca8c04e0af15c527216f5363910c

// 2023/12/26: Paranet on testnet
// yarn deploy:matic_test:arkReward  
// Proxy:           0x138E8e06F64ef9aAd795b7bF90E04004eb5E7463        
// Implementaion:   0x13522dbB30a14A884a16B622868E7037efdd252C

// 2023/12/29: Paranet on mainnet
// yarn deploy:matic:arkReward  
// Proxy:           0x7654db08Da620bC36e9F15F40De7FeEf9265a808         
// Implementaion:   0x82c7ae0b76Cead58Ad93aAc462139E396Df50Fb8

// 2024/02/22: Arkreen Mainnet Launch on Polygon mainnet (Cannot be exactly matched, Aborted)
// yarn deploy:matic:arkReward
// Proxy:           0xD758CCd350C6fE798B7532CA8BAA0a161F64e6c2            
// Implementaion:   0xB1E67d7516290fe55C3e99cCef15830cfF5Cf37E

// 2024/02/22A: Arkreen Mainnet Launch on Polygon mainnet
// yarn deploy:matic:arkReward
// Proxy:           0xDcF10d429c0422Af80790bC810A33189771D643d (Deployed by proxy)            
// Implementaion:   0xF8b41C01622Ad43148a0DdF844F60dE334d8a119

// 2024/02/22B: Arkreen deployment to verify 
// yarn deploy:matic_test:arkReward
// Proxy:           0x6e5b52BAcc7431aBE2Ea767f8de01130E2bBec9F            
// Implementaion:   0x6d9f00596E2eD8082538e9df74F4bbed9Db74005

// 2024/04/15: Reward deployment
// yarn deploy:matic_test:arkReward
// Proxy:           0x78F018BF6af8C9A366735CFf0689486A0855bF89            
// Implementaion:   0xeb0a8d25cc479825e6Ca942D516a1534C32dFBe4


func.tags = ["arkReward"];

export default func;
