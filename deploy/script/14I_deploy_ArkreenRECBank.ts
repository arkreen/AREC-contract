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
    let HART_REC      
    let ART_CONTROLLER
    let BUILDER_ADDRESS

    let USDC_ADDRESS
    let USDT_ADDRESS
    let WMATIC_ADDRESS
    let AKRE_ADDRESS

    let USDC_PRICE
    let USDT_PRICE
    let MATIC_PRICE    
    let AKRE_PRICE

    if(hre.network.name === 'matic_test') {    
      // 2023/03/14, simulation 
      RECBANK_ADDRESS   = "0x7ee6D2A14d6Db71339a010d44793B27895B36d50"          // 2023/3/14 HashKey ESG BTC address
      ART_CONTROLLER    = "0xB53B96e1eF29cB14313c18Fa6374AB87df59BcD9"          // HART_Controller
      HART_REC          = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"          // HART REC Token
      BUILDER_ADDRESS   = "0xA05A9677a9216401CF6800d28005b227F7A3cFae"          // ArkreenBuilder

      USDC_ADDRESS    = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23"          // USDC address
      USDT_ADDRESS    = "0xD89EDB2B7bc5E80aBFD064403e1B8921004Cdb4b"          // USDT address
      WMATIC_ADDRESS  = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"          // WMATIC address
      AKRE_ADDRESS    = "0x54e1c534f59343c56549c76d1bdccc8717129832"          // AKRE address

      USDC_PRICE      = BigNumber.from(2).mul(BigNumber.from(10).pow(6))      // 2 USDC, 10**6
      USDT_PRICE      = BigNumber.from(2).mul(BigNumber.from(10).pow(6))      // 2 USDT, 10**6
      MATIC_PRICE     = BigNumber.from(5).mul(BigNumber.from(10).pow(16))     // 0.05 MATIC, as Test MATIC is too less
      AKRE_PRICE      = expandTo18Decimals(200)                               // 200 AKRE
    }

    else if(hre.network.name === 'matic')  {        // Matic Mainnet
      RECBANK_ADDRESS   = "0xab65900A52f1DcB722CaB2e5342bB6b128630A28"          // HashKey ESG BTC address
      ART_CONTROLLER    = "0x8bCe3621901909851ba5579060D9058Ef489a9EF"
      HART_REC          = "0x93b3bb6C51A247a27253c33F0d0C2FF1d4343214"
      BUILDER_ADDRESS   = "0x7073Ea8C9B0612F3C3FE604425E2af7954c4c92e"          // ArkreenBuilder

      USDC_ADDRESS      = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"          // USDC address
      USDT_ADDRESS      = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"          // USDT address
      WMATIC_ADDRESS    = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"          // WMATIC address
      AKRE_ADDRESS      = "0x21b101f5d61a66037634f7e1beb5a733d9987d57"          // tAKRE address

      USDC_PRICE =      BigNumber.from(25).mul(BigNumber.from(10).pow(5))       // 2.5 USDC
      USDT_PRICE =      BigNumber.from(25).mul(BigNumber.from(10).pow(5))       // 2.5 USDT
      MATIC_PRICE=      expandTo15Decimals(2500)                                // 2.5 MATIC, 
//    AKRE_PRICE =      expandTo18Decimals(200)                                 // 200 AKRE
    } 
    
    const [deployer, controller] = await ethers.getSigners();

    console.log("Deployer and controller are", deployer.address, controller.address)

    // Approve HashKeyESGBTCContract to Tranfer-From the specified tokens
    const ArkreenRECBankFactory = ArkreenRECBank__factory.connect(RECBANK_ADDRESS as string, deployer);

/*  
    //  CAN NOT Set BUILDER_ADDRESS !!!!!!!!!!!!!!!!!!!
    const setForwarderTrx = await ArkreenRECBankFactory.setForwarder(BUILDER_ADDRESS as string, true)
    await setForwarderTrx.wait()
*/
    // 2023/04/05
//    const addNewARTTRx = await ArkreenRECBankFactory.addNewART(HART_REC as string , ART_CONTROLLER as string);
//    await addNewARTTRx.wait()

    // Called by controller, Account 2
    // 2023/04/06
    const changeSalePriceUSDSC = await ArkreenRECBankFactory.connect(controller).changeSalePrice(HART_REC as string, 
                                    USDC_ADDRESS as string, USDC_PRICE as BigNumber)
    await changeSalePriceUSDSC.wait()

    // 2023/04/06
    const changeSalePriceUSDST = await ArkreenRECBankFactory.connect(controller).changeSalePrice(HART_REC as string, 
                                    USDT_ADDRESS as string, USDT_PRICE as BigNumber)
    await changeSalePriceUSDST.wait()

//    const changeSalePriceMATIC = await ArkreenRECBankFactory.connect(controller).changeSalePrice(HART_REC as string, 
//                                    WMATIC_ADDRESS as string, MATIC_PRICE as BigNumber)
//    await changeSalePriceMATIC.wait()   

      // tAKRE removed    
//    const changeSalePriceAKRE = await ArkreenRECBankFactory.changeSalePrice(HART_REC as string, 
//                                    AKRE_ADDRESS as string, AKRE_PRICE as BigNumber)
//    await changeSalePriceAKRE.wait()

/*
    // Need to use HART controler
    const ArkreenRECTokenFactory = ArkreenRECToken__factory.connect(HART_REC as string, deployer);
    const approveTrx = await ArkreenRECTokenFactory.approve(RECBANK_ADDRESS as string, constants.MaxUint256)
    await approveTrx.wait()

    const depositARTTrx = await ArkreenRECBankFactory.depositART(HART_REC as string, 
                                      BigNumber.from(3000).mul(BigNumber.from(10).pow(9)))      // 1000 HART
    await depositARTTrx.wait()
*/
    console.log("ArkreenRECBank Price is updated: ", hre.network.name, new Date().toLocaleString(),
                              ArkreenRECBankFactory.address,
                              RECBANK_ADDRESS, HART_REC, ART_CONTROLLER, BUILDER_ADDRESS,
                              [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS],
                              [USDC_PRICE, USDT_PRICE, MATIC_PRICE, AKRE_PRICE] );                              

};


// 2023/04/05
// yarn deploy:matic:ArtBankI
// Action: addNewART,  changeSalePrice(USDC), changeSalePrice(USDT), changeSalePrice(WMATIC)   

// 2023/04/06: Correct USDC/USDT price
// yarn deploy:matic:ArtBankI
// Action: changeSalePrice(USDC), changeSalePrice(USDT)

func.tags = ["ArtBankI"];

export default func;
