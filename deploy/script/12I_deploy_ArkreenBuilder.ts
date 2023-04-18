import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ArkreenBuilder__factory } from "../../typechain";
import { ArkreenRECToken__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let BUILDER_ADDRESS
    let HART_ADDRESS
    let HSKESG_ADDRESS
    let USDC_ADDRESS
    let USDT_ADDRESS
    let WMATIC_ADDRESS
    let AKRE_ADDRESS

    if(hre.network.name === 'matic_test')  {    
      // 2023/03/02, simulation 
      BUILDER_ADDRESS  = "0xa05a9677a9216401cf6800d28005b227f7a3cfae"         // Action Builder address
      HART_ADDRESS    = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"         // HART Address    
//    HSKESG_ADDRESS  = "0xDe8e59dAB27EB97b2267d4230f8FE713A637e03c"         // HashKeyESG Address    2023/03/05
      HSKESG_ADDRESS  = "0x785dca2ca9a51513da1fef9f70e6b6ab02896f67"         // HashKeyESG Address    2023/03/14

      USDC_ADDRESS    = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23"        // USDC address
      USDT_ADDRESS    = "0xD89EDB2B7bc5E80aBFD064403e1B8921004Cdb4b"        // USDT address
      WMATIC_ADDRESS  = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"        // WMATIC address
      AKRE_ADDRESS    = "0x54e1c534f59343c56549c76d1bdccc8717129832"        // AKRE address
    }
    else if(hre.network.name === 'matic')  {        // Matic Mainnet for test
      BUILDER_ADDRESS   = "0x7073Ea8C9B0612F3C3FE604425E2af7954c4c92e"          // Action Builder address
      HART_ADDRESS      = "0x93b3bb6C51A247a27253c33F0d0C2FF1d4343214"          // HART Address
      HSKESG_ADDRESS    = "0xfe9341218c7Fcb6DA1eC131a72f914B7C724F200"          // HashKeyESG Address          

      USDC_ADDRESS      = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"          // USDC address
      USDT_ADDRESS      = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"          // USDT address
      WMATIC_ADDRESS    = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"          // WMATIC address
      AKRE_ADDRESS      = "0x21b101f5d61a66037634f7e1beb5a733d9987d57"          // tAKRE address
    } 

    const [deployer] = await ethers.getSigners();

    // 2023/04/05
    // Set ArkreenBuilder address to the HART token contract
    const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(HART_ADDRESS as string, deployer);
    const setClimateBuilderTx = await ArkreenRECTokenFactory.setClimateBuilder( BUILDER_ADDRESS as string)
    await setClimateBuilderTx.wait()
    console.log(" Set ArkreenBuilder address to the HART token contract: ", hre.network.name, BUILDER_ADDRESS, HART_ADDRESS );

    // 2023/3/15, 2023/04/05
    const ArkreenBuilderFactory = ArkreenBuilder__factory.connect(BUILDER_ADDRESS as string, deployer);

    const mangeTrustedForwarderTx = await ArkreenBuilderFactory.mangeTrustedForwarder(HSKESG_ADDRESS as string, true)
    await mangeTrustedForwarderTx.wait()
    console.log("ArkreenBuilder mangeTrustedForwarder is executed: ", hre.network.name, new Date().toLocaleString(),
                                                    BUILDER_ADDRESS, HSKESG_ADDRESS );    

    // Approve the DEX Router to Tranfer-From the specified tokens
    // const ArkreenBuilderFactory = ArkreenBuilder__factory.connect(BUILDER_ADDRESS as string, deployer);

    // 2023/04/05
    const approveRouterTx = await ArkreenBuilderFactory.approveRouter(
                                      [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] as string[])
    await approveRouterTx.wait()
    console.log("ArkreenBuilder approveRouter is executed: %s: ", hre.network.name, BUILDER_ADDRESS, 
                              [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] );

    // const ArkreenBuilderFactory = ArkreenBuilder__factory.connect(BUILDER_ADDRESS as string, deployer);

    // 2023/04/05
    const approveArtBankTx = await ArkreenBuilderFactory.approveArtBank(
                                      [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] as string[])
    await approveArtBankTx.wait()
    console.log("ArkreenBuilder approveRouter is executed: %s: ", hre.network.name, BUILDER_ADDRESS, 
                              [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] );

};

// 2023/04/05
// yarn deploy:matic:ABuilderI
// Action: setClimateBuilder(HART_ADDRESS),  mangeTrustedForwarder, approveRouter, approveArtBank   

func.tags = ["ABuilderI"];

export default func;
