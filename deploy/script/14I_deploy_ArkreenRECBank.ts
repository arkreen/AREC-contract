import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ArkreenRECBank__factory } from "../../typechain";
import { ArkreenRECToken__factory } from "../../typechain";

import { BigNumber, constants } from "ethers";

function expandTo18Decimals(n: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(18))
}

function expandTo15Decimals(n: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(15))
}

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let RECBANK_ADDRESS
    let ART_AREC
    let HART_AREC      
    let CART_AREC
    let CART_CONTROLLER

    let ART_CONTROLLER
    let BUILDER_ADDRESS

    let USDC_ADDRESS
    let USDT_ADDRESS
    let WNATIVE_ADDRESS
    let AKRE_ADDRESS

    let USDC_PRICE
    let USDT_PRICE
    let MATIC_PRICE    
    let AKRE_PRICE

    if(hre.network.name === 'matic_test') {    
      // 2023/03/14, simulation 
      // RECBANK_ADDRESS   = "0x7ee6D2A14d6Db71339a010d44793B27895B36d50"   
      // ART_CONTROLLER    = "0xB53B96e1eF29cB14313c18Fa6374AB87df59BcD9"          // HART_Controller
      // ART_AREC          = "0xb0c9dd915f62d0a37792fd2ce497680e909d8c0f"          // AREC ART token
      // HART_AREC          = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"          // HART REC Token
      // BUILDER_ADDRESS   = "0xA05A9677a9216401CF6800d28005b227F7A3cFae"          // ArkreenBuilder

      // USDC_ADDRESS    = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23"          // USDC address
      // USDT_ADDRESS    = "0xD89EDB2B7bc5E80aBFD064403e1B8921004Cdb4b"          // USDT address
      // WNATIVE_ADDRESS  = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"         // WMATIC address
      // AKRE_ADDRESS    = "0x54e1c534f59343c56549c76d1bdccc8717129832"          // AKRE address

      // 2023/12/13, Dev env 
      RECBANK_ADDRESS   = "0x9e1dde2912a804e39e5b19c8b670a6cee0b1ca7a"          // 2023/12/13 HART Bank Address

      ART_CONTROLLER    = "0xB53B96e1eF29cB14313c18Fa6374AB87df59BcD9"          // HART_Controller
      ART_AREC          = "0x70FdFE7DA492080A8F0233F67C5B48D36d8ceE8b"          // AREC ART token
      HART_AREC          = "0xCAABA1AC075Ba045e8C21F9Ae00347EB4FADA3A1"          // HART REC Token
      CART_AREC         = "0x9031550a0aE38337a19E4eFA372B3e6b0FE94D3f"          // CART REC Token

      USDC_ADDRESS    = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23"            // USDC address
      USDT_ADDRESS    = "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832"            // USDT address
      WNATIVE_ADDRESS  = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"           // WMATIC address
      AKRE_ADDRESS    = "0x8Ab2299351585097101c91FE4b098d95c18D28a7"            // AKRE address

      USDC_PRICE      = BigNumber.from(2).mul(BigNumber.from(10).pow(4))        // 0.02 USDC, 10**6
      USDT_PRICE      = BigNumber.from(2).mul(BigNumber.from(10).pow(4))        // 0.02 USDT, 10**6
      MATIC_PRICE     = BigNumber.from(5).mul(BigNumber.from(10).pow(15))       // 0.005 MATIC, as Test MATIC is too less
      AKRE_PRICE      = expandTo18Decimals(100)                                 // 100 tAKRE

      const [deployer] = await ethers.getSigners();

      // Approve HashKeyESGBTCContract to Tranfer-From the specified tokens
      const ArkreenRECBankFactory = ArkreenRECBank__factory.connect(RECBANK_ADDRESS as string, deployer);

      // 2023/08/08: 1/3, Called from Account 1
      // const addNewARTTRx = await ArkreenRECBankFactory.addNewART(ART_AREC as string , ART_CONTROLLER as string);
      // await addNewARTTRx.wait()

      // 2023/12/13: Polygon testnet Dev env, add ART_AREC/HART_AREC/CART_AREC
      let addNewARTTRx
      {
        addNewARTTRx = await ArkreenRECBankFactory.addNewART(ART_AREC as string , ART_CONTROLLER as string);  // 2023/12/13
        await addNewARTTRx.wait()
        addNewARTTRx = await ArkreenRECBankFactory.addNewART(HART_AREC as string , ART_CONTROLLER as string); // 2023/12/13
        await addNewARTTRx.wait()
        addNewARTTRx = await ArkreenRECBankFactory.addNewART(CART_AREC as string , ART_CONTROLLER as string); // 2023/12/13
        await addNewARTTRx.wait()
      }

      // 2023/12/13: Polygon testnet Dev env,  set ART_AREC/HART_AREC/CART_AREC sale price
      let changeSalePrice
      {
        changeSalePrice = await ArkreenRECBankFactory.changeSalePrice(ART_AREC as string,        // 2023/12/13
                                    USDC_ADDRESS as string, USDC_PRICE as BigNumber)
        await changeSalePrice.wait()
        changeSalePrice = await ArkreenRECBankFactory.changeSalePrice(ART_AREC as string,        // 2023/12/13
                                    USDT_ADDRESS as string, USDT_PRICE as BigNumber)
        await changeSalePrice.wait()
        changeSalePrice = await ArkreenRECBankFactory.changeSalePrice(ART_AREC as string,        // 2023/12/13
                                    WNATIVE_ADDRESS as string, MATIC_PRICE as BigNumber)
        await changeSalePrice.wait()
        changeSalePrice = await ArkreenRECBankFactory.changeSalePrice(ART_AREC as string,        // 2023/12/13
                                    AKRE_ADDRESS as string, AKRE_PRICE as BigNumber)
        await changeSalePrice.wait()

        changeSalePrice = await ArkreenRECBankFactory.changeSalePrice(HART_AREC as string,        // 2023/12/13
                                    USDC_ADDRESS as string, USDC_PRICE as BigNumber)
        await changeSalePrice.wait()
        changeSalePrice = await ArkreenRECBankFactory.changeSalePrice(HART_AREC as string,        // 2023/12/13
                                    USDT_ADDRESS as string, USDT_PRICE as BigNumber)
        await changeSalePrice.wait()
        changeSalePrice = await ArkreenRECBankFactory.changeSalePrice(HART_AREC as string,        // 2023/12/13
                                    WNATIVE_ADDRESS as string, MATIC_PRICE as BigNumber)
        await changeSalePrice.wait()
        changeSalePrice = await ArkreenRECBankFactory.changeSalePrice(HART_AREC as string,        // 2023/12/13
                                    AKRE_ADDRESS as string, AKRE_PRICE as BigNumber)
        await changeSalePrice.wait()

        changeSalePrice = await ArkreenRECBankFactory.changeSalePrice(CART_AREC as string,        // 2023/12/13
                                    USDC_ADDRESS as string, USDC_PRICE as BigNumber)
        await changeSalePrice.wait()
        changeSalePrice = await ArkreenRECBankFactory.changeSalePrice(CART_AREC as string,        // 2023/12/13
                                    USDT_ADDRESS as string, USDT_PRICE as BigNumber)
        await changeSalePrice.wait()
        changeSalePrice = await ArkreenRECBankFactory.changeSalePrice(CART_AREC as string,        // 2023/12/13
                                    WNATIVE_ADDRESS as string, MATIC_PRICE as BigNumber)
        await changeSalePrice.wait()
        changeSalePrice = await ArkreenRECBankFactory.changeSalePrice(CART_AREC as string,        // 2023/12/13
                                    AKRE_ADDRESS as string, AKRE_PRICE as BigNumber)
        await changeSalePrice.wait()
      }

      // Need to use HART controler
      // 2023/12/13: Approve RECBANK_ADDRESS, Called by controller
      let ArkreenRECTokenFactory
      let approveTrx
      {
        ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(ART_AREC as string, deployer);
        approveTrx = await ArkreenRECTokenFactory.approve(RECBANK_ADDRESS as string, constants.MaxUint256)  // 2023/12/13
        await approveTrx.wait()

        ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(HART_AREC as string, deployer);
        approveTrx = await ArkreenRECTokenFactory.approve(RECBANK_ADDRESS as string, constants.MaxUint256)  // 2023/12/13
        await approveTrx.wait()

        ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(CART_AREC as string, deployer);
        approveTrx = await ArkreenRECTokenFactory.approve(RECBANK_ADDRESS as string, constants.MaxUint256) // 2023/12/13
        await approveTrx.wait()
      }

/*
      // Called by Account 2
      // 2023/08/08, 2023/09/12
      const changeSalePriceUSDSC = await ArkreenRECBankFactory.changeSalePrice(HART_AREC as string, 
                                    USDC_ADDRESS as string, USDC_PRICE as BigNumber)
      await changeSalePriceUSDSC.wait()

      // 2023/08/08
//      const changeSalePriceUSDST = await ArkreenRECBankFactory.changeSalePrice(ART_AREC as string, 
//                                    USDT_ADDRESS as string, USDT_PRICE as BigNumber)
//      await changeSalePriceUSDST.wait()

      // 2023/08/08, 2023/09/12
      const changeSalePriceMATIC = await ArkreenRECBankFactory.changeSalePrice(HART_AREC as string, 
                                    WNATIVE_ADDRESS as string, MATIC_PRICE as BigNumber)
      await changeSalePriceMATIC.wait()   
      
      // 2023/08/08
//      const changeSalePriceAKRE = await ArkreenRECBankFactory.changeSalePrice(ART_AREC as string, 
//                                    AKRE_ADDRESS as string, AKRE_PRICE as BigNumber)
//      await changeSalePriceAKRE.wait()
*/

/*
      // Need to use HART controler
      // 2023/08/08: Approve RECBANK_ADDRESS, Called by Account 2
      const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(ART_AREC as string, deployer);
      const approveTrx = await ArkreenRECTokenFactory.approve(RECBANK_ADDRESS as string, constants.MaxUint256)
      await approveTrx.wait()
 
      // 2023/08/08: Deposit HART
      const depositARTTrx = await ArkreenRECBankFactory.depositART(ART_AREC as string, 
                                      BigNumber.from(300).mul(BigNumber.from(10).pow(9)))      // 300 HART
      await depositARTTrx.wait()  
*/      
       
    }

    else if(hre.network.name === 'matic')  {        // Matic Mainnet
      RECBANK_ADDRESS   = "0xab65900A52f1DcB722CaB2e5342bB6b128630A28"          // HashKey ESG BTC address

      ART_CONTROLLER    = "0x8bCe3621901909851ba5579060D9058Ef489a9EF"
      HART_AREC          = "0x93b3bb6C51A247a27253c33F0d0C2FF1d4343214"

      CART_AREC         = "0x0D7899F2D36344ed21829D4EBC49CC0d335B4A06"
      CART_CONTROLLER   = "0x1249B1eABcAE642CF3Cb1e512a0075CEe92769BE"

      BUILDER_ADDRESS   = "0x7073Ea8C9B0612F3C3FE604425E2af7954c4c92e"          // ArkreenBuilder

      USDC_ADDRESS      = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"          // USDC address
      USDT_ADDRESS      = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"          // USDT address
      WNATIVE_ADDRESS    = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"          // WMATIC address
      AKRE_ADDRESS      = "0x21b101f5d61a66037634f7e1beb5a733d9987d57"          // tAKRE address

      USDC_PRICE =      BigNumber.from(50).mul(BigNumber.from(10).pow(5))       // 5 USDC
      USDT_PRICE =      BigNumber.from(50).mul(BigNumber.from(10).pow(5))       // 5 USDT
      MATIC_PRICE=      expandTo15Decimals(5000)                                // 5 MATIC, 
//    AKRE_PRICE =      expandTo18Decimals(200)                                 // 200 AKRE
   
      const [deployer, controller] = await ethers.getSigners();
      const defaultGasPrice = BigNumber.from(100000000000)

      console.log("Deployer and controller are", deployer.address, controller.address)

      // Approve HashKeyESGBTCContract to Tranfer-From the specified tokens
      const ArkreenRECBankFactory = ArkreenRECBank__factory.connect(RECBANK_ADDRESS as string, deployer);

  /*  
      //  CAN NOT Set BUILDER_ADDRESS !!!!!!!!!!!!!!!!!!!
      const setForwarderTrx = await ArkreenRECBankFactory.setForwarder(BUILDER_ADDRESS as string, true)
      await setForwarderTrx.wait()
  */
      // 2023/04/05
  //    const addNewARTTRx = await ArkreenRECBankFactory.addNewART(HART_AREC as string , ART_CONTROLLER as string);
  //    await addNewARTTRx.wait()

      // 2023/10/25, addNewART CART
      const addNewARTTRx = await ArkreenRECBankFactory.addNewART(CART_AREC, CART_CONTROLLER, {gasPrice: defaultGasPrice});
      await addNewARTTRx.wait()

      // Called by controller, Account 2
      // 2023/04/06,  2023/04/10
  //    const changeSalePriceUSDSC = await ArkreenRECBankFactory.connect(controller).changeSalePrice(HART_AREC as string, 
  //                                    USDC_ADDRESS as string, USDC_PRICE as BigNumber)
  //    await changeSalePriceUSDSC.wait()

      // 2023/04/06, 2023/04/10
  //    const changeSalePriceUSDST = await ArkreenRECBankFactory.connect(controller).changeSalePrice(HART_AREC as string, 
  //                                    USDT_ADDRESS as string, USDT_PRICE as BigNumber)
  //    await changeSalePriceUSDST.wait()

/*
      // 2023/04/10
      const changeSalePriceMATIC = await ArkreenRECBankFactory.connect(controller).changeSalePrice(HART_AREC as string, 
                                      WNATIVE_ADDRESS as string, MATIC_PRICE as BigNumber)
      await changeSalePriceMATIC.wait()   
*/
        // tAKRE removed    
  //    const changeSalePriceAKRE = await ArkreenRECBankFactory.changeSalePrice(HART_AREC as string, 
  //                                    AKRE_ADDRESS as string, AKRE_PRICE as BigNumber)
  //    await changeSalePriceAKRE.wait()

  /*
      // Need to use HART controler
      // 2023/04/10: Approve RECBANK_ADDRESS
      const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(HART_AREC as string, controller);
      const approveTrx = await ArkreenRECTokenFactory.approve(RECBANK_ADDRESS as string, constants.MaxUint256)
      await approveTrx.wait()
  
      // 2023/04/10: Deposit HART
      const depositARTTrx = await ArkreenRECBankFactory.connect(controller).depositART(HART_AREC as string, 
                                        BigNumber.from(5000).mul(BigNumber.from(10).pow(9)))      // 5000 HART
      await depositARTTrx.wait()   
  */
      console.log("ArkreenRECBank Price is updated: ", hre.network.name, new Date().toLocaleString(),
                                ArkreenRECBankFactory.address,
                                RECBANK_ADDRESS, HART_AREC, ART_CONTROLLER, BUILDER_ADDRESS,
                                [USDC_ADDRESS, USDT_ADDRESS, WNATIVE_ADDRESS, AKRE_ADDRESS],
                                [USDC_PRICE, USDT_PRICE, MATIC_PRICE, AKRE_PRICE] );  
    }          
    
    else if(hre.network.name === 'celo_test')  {        // Celo Testnet 2023/08/25
      RECBANK_ADDRESS   = "0x827155A6fD0aac8AbE7beb4Ee1a95143255ed438"          // 2023/8/25
      ART_CONTROLLER    = "0xB53B96e1eF29cB14313c18Fa6374AB87df59BcD9"          // HART_Controller
      // ART_AREC          = "0xb0c9dd915f62d0a37792fd2ce497680e909d8c0f"       // AREC ART token
      HART_AREC          = "0x57Fe6324538CeDd43D78C975118Ecf8c137fC8B2"          // HART REC Token

      BUILDER_ADDRESS   = "0xAC0B2E90b41a1b85520607e60dEf18B59e5a1c9F"          // ArkreenBuilder

      USDC_ADDRESS    = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"          // USDC address
//    USDT_ADDRESS    = "0xD89EDB2B7bc5E80aBFD064403e1B8921004Cdb4b"          // USDT address
      WNATIVE_ADDRESS  = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"         // CELO native asset
//    AKRE_ADDRESS    = "0x54e1c534f59343c56549c76d1bdccc8717129832"          // AKRE address

      USDC_PRICE      = BigNumber.from(5).mul(BigNumber.from(10).pow(17))     // 0.5 USDC, 10**18
//    USDT_PRICE      = BigNumber.from(5).mul(BigNumber.from(10).pow(17))     // 0.5 USDT, 10**18
      MATIC_PRICE     = BigNumber.from(1).mul(BigNumber.from(10).pow(17))     // 0.1 Celo
//    AKRE_PRICE      = expandTo18Decimals(200)                               // 200 AKRE
   
      const [deployer] = await ethers.getSigners();

      // Approve HashKeyESGBTCContract to Tranfer-From the specified tokens
      const ArkreenRECBankFactory = ArkreenRECBank__factory.connect(RECBANK_ADDRESS as string, deployer);
     
/*      
      // 2023/08/25: 1/3, Called from Account 1
      const addNewARTTRx = await ArkreenRECBankFactory.addNewART(HART_AREC as string , ART_CONTROLLER as string);
      await addNewARTTRx.wait()
*/
      
/*
      // Called by Account 2
      // 2023/08/25
      const changeSalePriceUSDSC = await ArkreenRECBankFactory.changeSalePrice(HART_AREC as string, 
                                    USDC_ADDRESS as string, USDC_PRICE as BigNumber)
      await changeSalePriceUSDSC.wait()

      // 2023/08/08
      // const changeSalePriceUSDST = await ArkreenRECBankFactory.changeSalePrice(HART_AREC as string, 
      //                              USDT_ADDRESS as string, USDT_PRICE as BigNumber)
      // await changeSalePriceUSDST.wait()

      // 2023/08/25
      const changeSalePriceMATIC = await ArkreenRECBankFactory.changeSalePrice(HART_AREC as string, 
                                    WNATIVE_ADDRESS as string, MATIC_PRICE as BigNumber)
      await changeSalePriceMATIC.wait()   

      // 2023/08/08
      // const changeSalePriceAKRE = await ArkreenRECBankFactory.changeSalePrice(HART_AREC as string, 
      //                              AKRE_ADDRESS as string, AKRE_PRICE as BigNumber)
      // await changeSalePriceAKRE.wait()
*/
      
      // Need to use HART controler
      // 2023/08/08: Approve RECBANK_ADDRESS, Called by Account 2
      const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(HART_AREC as string, deployer);
      const approveTrx = await ArkreenRECTokenFactory.approve(RECBANK_ADDRESS as string, constants.MaxUint256)
      await approveTrx.wait()

      // 2023/08/08: Deposit HART
      const depositARTTrx = await ArkreenRECBankFactory.depositART(HART_AREC as string, 
                                      BigNumber.from(300).mul(BigNumber.from(10).pow(9)))      // 300 HART
      await depositARTTrx.wait()  
    
    }

    else if(hre.network.name === 'celo')  {        // Celo Testnet 2023/11/01
      RECBANK_ADDRESS   = "0x815bFE3aaCF765c9E0A4DdEb98Ad710a4Fb860d3"          // 2023/11/01
      BUILDER_ADDRESS   = "0x3d5531cF0bC2e8d0658fEc0D1a9995211Ac1f337"          // ArkreenBuilder

      CART_AREC         = "0x9BBF9f544F3ceD640090f43FF6B820894f66Aaef"
      CART_CONTROLLER   = "0x1249B1eABcAE642CF3Cb1e512a0075CEe92769BE"

      USDC_ADDRESS    = "0x765DE816845861e75A25fCA122bb6898B8B1282a"          // USDC address: cUSD
//    USDT_ADDRESS    = "0xD89EDB2B7bc5E80aBFD064403e1B8921004Cdb4b"          // USDT address
      WNATIVE_ADDRESS  = "0x471EcE3750Da237f93B8E339c536989b8978a438"         // CELO native asset: Celo
//    AKRE_ADDRESS    = "0x54e1c534f59343c56549c76d1bdccc8717129832"          // AKRE address

      USDC_PRICE      = BigNumber.from(10).mul(BigNumber.from(10).pow(18))     // 10 USDC, 10**18
//    USDT_PRICE      = BigNumber.from(10).mul(BigNumber.from(10).pow(18))     // 10 USDT, 10**18
      MATIC_PRICE     = BigNumber.from(20).mul(BigNumber.from(10).pow(18))     // 20 Celo
//    AKRE_PRICE      = expandTo18Decimals(200)                               // 200 AKRE

      const [deployer] = await ethers.getSigners();

      // Approve HashKeyESGBTCContract to Tranfer-From the specified tokens
      const ArkreenRECBankFactory = ArkreenRECBank__factory.connect(RECBANK_ADDRESS as string, deployer);
     
      // 2023/11/01: Called from Account 1
      const addNewARTTRx = await ArkreenRECBankFactory.addNewART(CART_AREC as string , CART_CONTROLLER as string);
      await addNewARTTRx.wait()
    
    }

};


// 2023/04/05
// yarn deploy:matic:ArtBankI
// Action: addNewART,  changeSalePrice(USDC), changeSalePrice(USDT), changeSalePrice(WMATIC)   

// 2023/04/06: Correct USDC/USDT price
// yarn deploy:matic:ArtBankI
// Action: changeSalePrice(USDC), changeSalePrice(USDT)

// 2023/04/10: Approve(RECBANK_ADDRESS) and Deposit HART
// yarn deploy:matic:ArtBankI
// Action: approve(RECBANK_ADDRESS)
// Action: depositART(HART_AREC,5000)

// 2023/04/10
// yarn deploy:matic:ArtBankI
// Action: changeSalePrice(USDC,5), changeSalePrice(USDT,5), changeSalePrice(WMATIC,5)   

// 2023/08/08
// yarn deploy:matic_test:ArtBankI
// Action: addNewART (1/3)

// 2023/08/08
// yarn deploy:matic_test:ArtBankI (2/3)
// Action: changeSalePrice(USDC), changeSalePrice(USDT), changeSalePrice(WMATIC), changeSalePrice(AKRE)   
// Action: approve(RECBANK_ADDRESS), depositART(ART_AREC,300)

// 2023/08/08
// yarn deploy:matic_test:ArtBankI (3/3)
// Action: approve(RECBANK_ADDRESS), depositART(ART_AREC,300)

// 2023/08/25
// yarn deploy:celo_test:ArtBankI
// Action: addNewART (1/3)

// 2023/08/25
// yarn deploy:celo_test:ArtBankI (2/3)
// Action: changeSalePrice(USDC), changeSalePrice(WMATIC)  

// 2023/09/12
// yarn deploy:matic_test:ArtBankI: ART
// Action: changeSalePrice(USDC, 2*10**(-4)), changeSalePrice(WMATIC, 5*10**(-6))

// 2023/09/12
// yarn deploy:matic_test:ArtBankI: HART
// Action: changeSalePrice(USDC, 2*10**(-4)), changeSalePrice(WMATIC, 5*10**(-6))

// 2023/10/25
// yarn deploy:matic:ArtBankI:          // addNewART
// Action: addNewART

// 2023/10/25: Manually : 
// 1. changeSalePrice (USDC/CART, USDT/CART)
// 2. Approve(RECBANK_ADDRESS) (CART)
// 3. Deposit CART

// 2023/11/01
// yarn deploy:celo:ArtBankI:          // addNewART
// Action: addNewART

// 2023/11/01: Manually : 
// 1. changeSalePrice (cUSDC/CART)
// 2. Approve(RECBANK_ADDRESS) (CART)
// 3. Deposit CART

// 2023/12/13: （OK）
// yarn deploy:matic_test:ArtBankI
// 1. Action: addNewART (ART/HART/CART)
// 2. changeSalePrice (ART/HART/CART => USDC/USDT/WMATIC/tAKRE)
// 3. Approve(RECBANK_ADDRESS) (ART/HART/CART)

func.tags = ["ArtBankI"];

export default func;
