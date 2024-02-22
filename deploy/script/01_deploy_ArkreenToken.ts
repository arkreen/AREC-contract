import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

// import { expandTo18Decimals } from "../../test/utils/utilities";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    
    // function initialize(uint256 amount, address foundationAddr, string calldata name, string calldata symbol)
    const amount = 10_000_000_000

/*    
    // tAKRE on Mainnet
    const foundationAddr = '0x05D1e64fc523105CECEd7c5Ca70993CD69b8e808'
    const name = 'Arkreen Token'
    const symbol = 'tAKRE'
*/

/*
    // AKRE of Paranet on testnet // 2023/12/26
    const foundationAddr = '0xB53B96e1eF29cB14313c18Fa6374AB87df59BcD9'
    const name = ''
    const symbol = ''
*/
/*
    // AKRE of Paranet on testnet // 2023/12/29
    const foundationAddr = '0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D'
    const name = ''
    const symbol = ''
*/
    // AKRE on Polygon mainnet for Arkreen mainnet Launch // 2024/02/22
    const foundationAddr = '0xA997bF1f0678B63815fBabe573825170715eBecc'
    const name = ''
    const symbol = ''
   
    const ArkreenToken = await deploy(CONTRACTS.AKRE, {
      from: deployer,
      proxy: {
        proxyContract: "UUPSProxy",
        execute: {
          init: {
            methodName: "initialize",   // Function to call when deployed first time.
            args: [amount, foundationAddr, name, symbol]
          },
        },
      },
      log: true,
      skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenToken deployed to %s: ", hre.network.name, ArkreenToken.address, foundationAddr);
    
};

// 2023/04/04: deploy tAKRE
// yarn deploy:matic:ARKE
// Proxy:           0x21B101f5d61A66037634f7e1BeB5a733d9987D57
// Implementation:  0xe47Ee63316855522f4719C36D75964F9B8453A94

// 2023/12/26: deploy AKRE for Paranet on testnet
// yarn deploy:matic_test:ARKE
// Proxy:           0xbc9de41189F76519e8Aa43157F2D4faf305458da
// Implementation:  0x1b6209dFb258ba757066CC8BDa987d592962b375

// 2023/12/29: deploy AKRE for Paranet on mainnet
// yarn deploy:matic:ARKE
// Proxy:           0x990393E7540883260BBEBf1960C77b78Ad5F0146
// Implementation:  0x883e8627cc13281eae70c84918Fb7fb6e044E897

// 2024/02/22: deploy AKRE on Polygon mainnet for Arkreen mainnet Launch
// yarn deploy:matic:ARKE
// Proxy:           0xE9c21De62C5C5d0cEAcCe2762bF655AfDcEB7ab3
// Implementation:  0x0fad83bc38790c2dc2ef8f30f9b5ced473ffffdf

func.tags = ["ARKE"];

export default func;
