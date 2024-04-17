import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ArkreenBuilder__factory } from "../../typechain";
import { ArkreenRECToken__factory } from "../../typechain";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let BUILDER_ADDRESS
    let ART_ADDRESS
    let HART_ADDRESS
    let HSKESG_ADDRESS
    let GREEN_BTC_ADDRESS
    let USDC_ADDRESS
    let USDT_ADDRESS
    let WNATIVE_ADDRESS
    let AKRE_ADDRESS
    let CART_ADDRESS

    const defaultGasPrice = (hre.network.name === 'matic_test') 
                          ? BigNumber.from(3_000_000_000) 
                          : (hre.network.name === 'matic')
                          ? BigNumber.from(200000000000)
                          : (hre.network.name === 'celo_test')
                          ? BigNumber.from(200000000000)
                          : BigNumber.from(200000000000)

    if(hre.network.name === 'matic_test')  {  

      // 2023/03/02, simulation 
//    BUILDER_ADDRESS  = "0xA05A9677a9216401CF6800d28005b227F7A3cFae"         // Action Builder address
//    HART_ADDRESS    = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"         // HART Address    

//    HSKESG_ADDRESS  = "0xDe8e59dAB27EB97b2267d4230f8FE713A637e03c"         // HashKeyESG Address        2023/03/05
//    HSKESG_ADDRESS  = "0x785dca2ca9a51513da1fef9f70e6b6ab02896f67"         // HashKeyESG Address        2023/03/14
//    GREEN_BTC_ADDRESS  = "0x56DF27Ab91f7519becA1465293f61f9551844cb3"      // HashKeyESG Address        2023/09/07
//    GREEN_BTC_ADDRESS  = "0xc9C744A220Ec238Bcf7798B43C9272622aF82997"      // HashKeyESG Address        2023/09/12
//    GREEN_BTC_ADDRESS  = "0x2BCCE98D208f9f45330006C24cbC756A0A7ddB3a"      // HashKeyESG Address        2023/10/13
//    GREEN_BTC_ADDRESS  = "0x8b6Bd79A3D627833c93108eCb651A41905c6568a"      // Green BTC Address         2023/10/17
//    GREEN_BTC_ADDRESS  = "0x26fa0cc54eC938DB5919b0ABc8353016f3BD81b1"      // Green BTC Address         2023/10/20
//    GREEN_BTC_ADDRESS  = "0x8Cc0B065318ACf3Ac761FE5A19Caf68074034006"      // Green BTC Address         2023/10/23
//    GREEN_BTC_ADDRESS  = "0x770cB90378Cb59665BbF623a72b90f427701C825"      // Green BTC Address         2023/10/24

      // Polygon testnet Simulation
      // USDC_ADDRESS    = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23"        // USDC address
      // USDT_ADDRESS    = "0xD89EDB2B7bc5E80aBFD064403e1B8921004Cdb4b"        // USDT address
      // WNATIVE_ADDRESS  = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"       // WMATIC address
      // AKRE_ADDRESS    = "0x54e1c534f59343c56549c76d1bdccc8717129832"        // AKRE address

/*      
      // 2023/12/13, Polygon testnet Dev env 
      BUILDER_ADDRESS    = "0xC88535788B4e45966c529D8b3FAd027d1E2d5a0a"          // Action Builder address
      ART_ADDRESS        = "0x70FdFE7DA492080A8F0233F67C5B48D36d8ceE8b"          // AREC ART token
      HART_ADDRESS       = "0xCAABA1AC075Ba045e8C21F9Ae00347EB4FADA3A1"          // HART REC Token
      CART_ADDRESS       = "0x9031550a0aE38337a19E4eFA372B3e6b0FE94D3f"          // CART REC Token

      // 2023/12/13, Polygon testnet Dev env
      USDC_ADDRESS      = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23"            // USDC address
      USDT_ADDRESS      = "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832"            // USDT address
      WNATIVE_ADDRESS   = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"            // WMATIC address
      AKRE_ADDRESS      = "0x8Ab2299351585097101c91FE4b098d95c18D28a7"            // AKRE address
*/
      // 2024/04/19, Amoy testnet Dev env 
      BUILDER_ADDRESS    = "0x12De6c1FB46B64e3DA5bFDD274E98B9103353dF7"          // Action Builder address
      GREEN_BTC_ADDRESS  = "0x2Bb79dB8b6149F7499CA1bA7eeBE9E736be4dBA9"          // Green BTC Address
      ART_ADDRESS        = "0x615835Cc22064a17df5A3E8AE22F58e67bCcB778"          // AREC ART token
      CART_ADDRESS       = "0x78A2620C3fb96100Dc551Db657005eEeF270F0DF"          // CART REC Token
      USDC_ADDRESS       = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"          // USDC address
      USDT_ADDRESS       = "0xc7767ae828E4830e2f800981E573f333d1E492b5"          // USDT address
      WNATIVE_ADDRESS    = "0x0ae690AAD8663aaB12a671A6A0d74242332de85f"          // WMATIC address
      AKRE_ADDRESS       = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"          // AKRE address

    }
    else if(hre.network.name === 'matic')  {        // Matic Mainnet for test

      BUILDER_ADDRESS   = "0x7073Ea8C9B0612F3C3FE604425E2af7954c4c92e"          // Action Builder address
      HART_ADDRESS      = "0x93b3bb6C51A247a27253c33F0d0C2FF1d4343214"          // HART Address
      CART_ADDRESS      = "0x0D7899F2D36344ed21829D4EBC49CC0d335B4A06"          // HART Address
      
      HSKESG_ADDRESS    = "0xfe9341218c7Fcb6DA1eC131a72f914B7C724F200"          // HashKeyESG Address   
      GREEN_BTC_ADDRESS = "0xDf51F3DCD849f116948A5B23760B1ca0B5425BdE"          // Green BTC Address    2023/10/27
 
      USDC_ADDRESS      = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"          // USDC address
      USDT_ADDRESS      = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"          // USDT address
      WNATIVE_ADDRESS    = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"          // WMATIC address
      AKRE_ADDRESS      = "0x21b101f5d61a66037634f7e1beb5a733d9987d57"          // tAKRE address

    } else if(hre.network.name === 'celo_test')  {        // Celo testnet

      BUILDER_ADDRESS   = "0xAC0B2E90b41a1b85520607e60dEf18B59e5a1c9F"          // Action Builder address
      HART_ADDRESS      = "0x57Fe6324538CeDd43D78C975118Ecf8c137fC8B2"          // HART Address

      USDC_ADDRESS      = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"          // USDC address
      // USDT_ADDRESS      = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"          // USDT address
      WNATIVE_ADDRESS    = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"          // CELO native asset

    } else if(hre.network.name === 'celo')  {        // Celo mainnet

      BUILDER_ADDRESS   = "0x3d5531cF0bC2e8d0658fEc0D1a9995211Ac1f337"          // Action Builder address
      HART_ADDRESS      = "0x9BBF9f544F3ceD640090f43FF6B820894f66Aaef"          // HART Address

      USDC_ADDRESS      = "0x765DE816845861e75A25fCA122bb6898B8B1282a"          // USDC address
      // USDT_ADDRESS      = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"          // USDT address
      WNATIVE_ADDRESS    = "0x471EcE3750Da237f93B8E339c536989b8978a438"          // CELO native asset
    } 

    const [deployer] = await ethers.getSigners();
    
/*    
    // 2023/04/05, 2023/08/25:Celo_test, 2023/10/25: Matic Mainnet: CART 
    // Set ArkreenBuilder address to the HART token contract
    const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(CART_ADDRESS as string, deployer);
    const setClimateBuilderTx = await ArkreenRECTokenFactory.setClimateBuilder( BUILDER_ADDRESS as string, {gasPrice: defaultGasPrice})
    await setClimateBuilderTx.wait()
    console.log(" Set ArkreenBuilder address to the HART token contract: ", hre.network.name, BUILDER_ADDRESS, CART_ADDRESS );
*/

/*
    // 2023/12/13, Polygon testnet Dev Env 
    // 2024/04/17, Amoy testnet
    // Set ArkreenBuilder address to the HART token contract
    let ArkreenRECTokenFactory
    let setClimateBuilderTx 
    {
      ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(ART_ADDRESS as string, deployer);
      setClimateBuilderTx = await ArkreenRECTokenFactory.setClimateBuilder( BUILDER_ADDRESS as string, {gasPrice: defaultGasPrice})
      await setClimateBuilderTx.wait()

      // No Hart on Amoy testnet
      // ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(HART_ADDRESS as string, deployer);
      // setClimateBuilderTx = await ArkreenRECTokenFactory.setClimateBuilder( BUILDER_ADDRESS as string, {gasPrice: defaultGasPrice})
      // await setClimateBuilderTx.wait()

      ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(CART_ADDRESS as string, deployer);
      setClimateBuilderTx = await ArkreenRECTokenFactory.setClimateBuilder( BUILDER_ADDRESS as string, {gasPrice: defaultGasPrice})
      await setClimateBuilderTx.wait()

      console.log(" Set ArkreenBuilder address to the HART token contract: ", hre.network.name, 
                                                    BUILDER_ADDRESS, ART_ADDRESS, HART_ADDRESS, CART_ADDRESS );
    }
*/

/*
    // 2023/3/15, 2023/04/05
    const ArkreenBuilderFactory = ArkreenBuilder__factory.connect(BUILDER_ADDRESS as string, deployer);

    const mangeTrustedForwarderTx = await ArkreenBuilderFactory.mangeTrustedForwarder(HSKESG_ADDRESS as string, true)
    await mangeTrustedForwarderTx.wait()
    console.log("ArkreenBuilder mangeTrustedForwarder is executed: ", hre.network.name, new Date().toLocaleString(),
                                                    BUILDER_ADDRESS, HSKESG_ADDRESS );    
*/

    let ArkreenBuilderFactory = ArkreenBuilder__factory.connect(BUILDER_ADDRESS as string, deployer);

/*
    // 2023/09/07, 2023/09/12, 2023/10/13, 2023/10/23, 2023/10/24
    // 2024/04/17
    console.log("ArkreenBuilder mangeTrustedForwarder:", BUILDER_ADDRESS, GREEN_BTC_ADDRESS, deployer.address)

    const mangeTrustedForwarderTx = await ArkreenBuilderFactory.mangeTrustedForwarder(GREEN_BTC_ADDRESS as string, true, { gasPrice: defaultGasPrice })
    await mangeTrustedForwarderTx.wait()
    console.log("ArkreenBuilder mangeTrustedForwarder is executed: ", hre.network.name, new Date().toLocaleString(),
                                                    BUILDER_ADDRESS, GREEN_BTC_ADDRESS );    

    // Approve the DEX Router to Tranfer-From the specified tokens
    // const ArkreenBuilderFactory = ArkreenBuilder__factory.connect(BUILDER_ADDRESS as string, deployer);
*/

/*
    // 2023/04/05
    const approveRouterTx = await ArkreenBuilderFactory.approveRouter(
                                      [USDC_ADDRESS, USDT_ADDRESS, WNATIVE_ADDRESS, AKRE_ADDRESS] as string[])
    await approveRouterTx.wait()
    console.log("ArkreenBuilder approveRouter is executed: %s: ", hre.network.name, BUILDER_ADDRESS, 
                              [USDC_ADDRESS, USDT_ADDRESS, WNATIVE_ADDRESS, AKRE_ADDRESS] );

    // const ArkreenBuilderFactory = ArkreenBuilder__factory.connect(BUILDER_ADDRESS as string, deployer);
*/

/*
    // 2023/04/05
    const ArkreenBuilderFactory = ArkreenBuilder__factory.connect(BUILDER_ADDRESS as string, deployer);
    const approveArtBankTx = await ArkreenBuilderFactory.approveArtBank(
                                      [USDC_ADDRESS, USDT_ADDRESS, WNATIVE_ADDRESS, AKRE_ADDRESS] as string[])
    await approveArtBankTx.wait()
    console.log("ArkreenBuilder approveRouter is executed: %s: ", hre.network.name, BUILDER_ADDRESS, 
                              [USDC_ADDRESS, USDT_ADDRESS, WNATIVE_ADDRESS, AKRE_ADDRESS] );
*/


    // 2023/08/25: Celo_test, Approve USDT_ADDRESS, USDC_ADDRESS, NATIVE_ADDRESS
    // 2023/11/01: Celo, Approve USDC_ADDRESS, NATIVE_ADDRESS

/* // Celo
//    ArkreenBuilderFactory = ArkreenBuilder__factory.connect(BUILDER_ADDRESS as string, deployer);
//  const approveArtBankTx = await ArkreenBuilderFactory.approveArtBank(
//                                                [USDC_ADDRESS, WNATIVE_ADDRESS] as string[])
*/

    // 2023/12/13: Polygon testnet Dev env
    // 2024/04/17: Amoy testnet Dev env
    const approveArtBankTx = await ArkreenBuilderFactory.approveArtBank(
                            [USDC_ADDRESS, USDT_ADDRESS, WNATIVE_ADDRESS, AKRE_ADDRESS] as string[], { gasPrice: defaultGasPrice })
    await approveArtBankTx.wait()
    console.log("ArkreenBuilder approveRouter is executed: %s: ", hre.network.name, BUILDER_ADDRESS, 
                                                [USDC_ADDRESS, USDT_ADDRESS, WNATIVE_ADDRESS, AKRE_ADDRESS] );                              

};

// 2023/04/05
// yarn deploy:matic:ABuilderI
// Action: setClimateBuilder(HART_ADDRESS),  mangeTrustedForwarder, approveRouter, approveArtBank   

// 2023/08/25
// yarn deploy:celo_test:ABuilderI
// Action: setClimateBuilder(HART_ADDRESS),  approveArtBank(USDC_ADDRESS, WNATIVE_ADDRESS)   

// 2023/09/07
// yarn deploy:matic_test:ABuilderI: Add GreenBTC address
// Action: mangeTrustedForwarder

// 2023/09/12
// yarn deploy:matic_test:ABuilderI: Add GreenBTC address: 0xc9C744A220Ec238Bcf7798B43C9272622aF82997
// Action: mangeTrustedForwarder

// 2023/10/13
// yarn deploy:matic_test:ABuilderI: Add GreenBTC address: 0x2BCCE98D208f9f45330006C24cbC756A0A7ddB3a
// Action: mangeTrustedForwarder

// 2023/10/17
// yarn deploy:matic_test:ABuilderI: Add GreenBTC address: 0x8b6Bd79A3D627833c93108eCb651A41905c6568a
// Action: mangeTrustedForwarder

// 2023/10/20
// yarn deploy:matic_test:ABuilderI: Add GreenBTC address: 0x26fa0cc54eC938DB5919b0ABc8353016f3BD81b1
// Action: mangeTrustedForwarder

// 2023/10/23
// yarn deploy:matic_test:ABuilderI: Add GreenBTC address: 0x8Cc0B065318ACf3Ac761FE5A19Caf68074034006
// Action: mangeTrustedForwarder

// 2023/10/24
// yarn deploy:matic_test:ABuilderI: Add GreenBTC address: 0x770cB90378Cb59665BbF623a72b90f427701C825
// Action: mangeTrustedForwarder

// 2023/10/25
// yarn deploy:matic:ABuilderI:   // setClimateBuilder(CART_ADDRESS),
// Action: setClimateBuilder

// 2023/10/27
// yarn deploy:matic:ABuilderI:   // setClimateBuilder(CART_ADDRESS),
// Action: setClimateBuilder

// 2023/11/01
// yarn deploy:celo:ABuilderI
// Action: approveArtBank(USDC_ADDRESS, WNATIVE_ADDRESS)   

// 2023/12/13
// yarn deploy:matic_test:ABuilderI
// 1. setClimateBuilder:    (ART/HART/CART)   
// 2. approveArtBank:       (USDC_ADDRESS, USDT_ADDRESS, WNATIVE_ADDRESS, AKRE_ADDRESS)   

// 2024/04/17 （Amoy testnet)
// yarn deploy:matic_test:ABuilderI
// 1. setClimateBuilder:    (ART/CART)   
// 2. mangeTrustedForwarder
// 3. approveArtBank:       (USDC_ADDRESS, USDT_ADDRESS, WNATIVE_ADDRESS, AKRE_ADDRESS)   

func.tags = ["ABuilderI"];

export default func;
