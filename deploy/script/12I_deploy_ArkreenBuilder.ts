import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ArkreenBuilder__factory } from "../../typechain";
import { ArkreenRECToken__factory } from "../../typechain";


const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let BUIDER_ADDRESS
    let HART_ADDRESS
    let USDC_ADDRESS
    let USDT_ADDRESS
    let WMATIC_ADDRESS
    let AKRE_ADDRESS

    if(hre.network.name === 'matic_test')  {    
      // 2023/03/02, simulation 
      BUIDER_ADDRESS  = "0xa05a9677a9216401cf6800d28005b227f7a3cfae"         // Action Builder address
      HART_ADDRESS    = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"         // HART Address      

      USDC_ADDRESS    = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23"        // USDC address
      USDT_ADDRESS    = "0xD89EDB2B7bc5E80aBFD064403e1B8921004Cdb4b"        // USDT address
      WMATIC_ADDRESS  = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"        // WMATIC address
      AKRE_ADDRESS    = "0x54e1c534f59343c56549c76d1bdccc8717129832"        // AKRE address
    }
    else if(hre.network.name === 'matic')  {        // Matic Mainnet for test
      BUIDER_ADDRESS  = ""         // Action Builder address
      HART_ADDRESS    = ""        // HART Address

      USDC_ADDRESS    = ""        // USDC address
      USDT_ADDRESS    = ""        // USDT address
      WMATIC_ADDRESS  = ""        // WMATIC address
      AKRE_ADDRESS    = ""        // AKRE address
    } 
    const [deployer] = await ethers.getSigners();

    // Set ArkreenBuilder address to the HART token contract
    const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(HART_ADDRESS as string, deployer);

    const setClimateBuilderTx = await ArkreenRECTokenFactory.setClimateBuilder( BUIDER_ADDRESS as string)
    await setClimateBuilderTx.wait()
    console.log(" Set ArkreenBuilder address to the HART token contract: ", hre.network.name, BUIDER_ADDRESS, HART_ADDRESS );

    // Approve the DEX Router to Tranfer-From the specified tokens
/*    
    const ArkreenBuilderFactory = ArkreenBuilder__factory.connect(BUIDER_ADDRESS as string, deployer);

    const approveRouterTx = await ArkreenBuilderFactory.approveRouter(
                                      [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] as string[])
    await approveRouterTx.wait()
    console.log("ArkreenBuilder approveRouter is executed: %s: ", hre.network.name, BUIDER_ADDRESS, 
                              [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] );
*/                              
};

func.tags = ["ABuilderI"];

export default func;
