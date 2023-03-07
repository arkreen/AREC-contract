import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { HashKeyESGBTC__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let ESGBTC_ADDRESS
    let USDC_ADDRESS
    let USDT_ADDRESS
    let WMATIC_ADDRESS
    let AKRE_ADDRESS

    if(hre.network.name === 'matic_test')  {    
      // 2023/03/05, simulation 
      ESGBTC_ADDRESS  = "0xDe8e59dAB27EB97b2267d4230f8FE713A637e03c"         // HashKey ESG BTC address

      USDC_ADDRESS    = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23"        // USDC address
      USDT_ADDRESS    = "0xD89EDB2B7bc5E80aBFD064403e1B8921004Cdb4b"        // USDT address
      WMATIC_ADDRESS  = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"        // WMATIC address
      AKRE_ADDRESS    = "0x54e1c534f59343c56549c76d1bdccc8717129832"        // AKRE address
    }
    else if(hre.network.name === 'matic')  {        // Matic Mainnet
      ESGBTC_ADDRESS  = ""          // HashKey ESG BTC address

      USDC_ADDRESS    = ""          // USDC address
      USDT_ADDRESS    = ""          // USDT address
      WMATIC_ADDRESS  = ""          // WMATIC address
      AKRE_ADDRESS    = ""          // AKRE address
    } 
    const [deployer] = await ethers.getSigners();

    // Approve HashKeyESGBTCContract to Tranfer-From the specified tokens
    const HashKeyESGBTCFactory = HashKeyESGBTC__factory.connect(ESGBTC_ADDRESS as string, deployer);

    const approveRouterTx = await HashKeyESGBTCFactory.approveBuilder(
                                      [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] as string[])
    await approveRouterTx.wait()
    console.log("HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, ESGBTC_ADDRESS, 
                              [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] );
                              
};

func.tags = ["HskBTCI"];

export default func;
