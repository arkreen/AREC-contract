import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";
import { KWhToken__factory } from "../../typechain";
import { ArkreenRECToken__factory } from "../../typechain";
import { ethers } from "hardhat";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const [deployer] = await ethers.getSigners();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(160_000_000_000)

    let kWhTokenAddress
    let beneficiary
    let tokenART
    let artBank
    let arkreenBuilder
    let offsetManager

    let USDC_ADDRESS
    let USDT_ADDRESS
    let WNATIVE_ADDRESS
    let AKRE_ADDRESS

    let ART_PRICE
    let USDC_PRICE
    let USDT_PRICE
    
    if(hre.network.name === 'matic_test')  {
      // 2024/05/20: Amoy testnet                        
      kWhTokenAddress   = "0x3B109eA4298870D8dEF8b512444A58Dac909b23f"                // Amoy testnet
      tokenART          = "0x615835Cc22064a17df5A3E8AE22F58e67bCcB778"                // Amoy testnet

      USDC_ADDRESS    = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"                  // USDC address
      USDT_ADDRESS    = "0xc7767ae828E4830e2f800981E573f333d1E492b5"                  // USDT address
      WNATIVE_ADDRESS = "0x0ae690aad8663aab12a671a6a0d74242332de85f"                  // WMATIC address
      AKRE_ADDRESS    = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"                  // AKRE address

      ART_PRICE       = BigNumber.from(1).mul(BigNumber.from(10).pow(6))        // 0.001ART, 0.001*10**9
      USDC_PRICE      = BigNumber.from(2).mul(BigNumber.from(10).pow(1))        // 0.02 USDC, 10**6
      USDT_PRICE      = BigNumber.from(10).mul(BigNumber.from(10).pow(3))       // 10 USDT, 10**6

      beneficiary       = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"                // Amoy testnet
      
      const KWhToken = KWhToken__factory.connect(kWhTokenAddress, deployer);
      
      /*
      // 2024/05/20: Amoy testnet                        
      const badgeInfo =  {
        beneficiary:      beneficiary,
        offsetEntityID:   'GreenBTC Club',
        beneficiaryID:    'GreenBTC Club DAO',
        offsetMessage:    "Offset ART to mint equivalent kWh ERC20 token for Green BTC Dapp"
      }    

      await KWhToken.setBadgeInfo( badgeInfo, {gasPrice: defaultGasPrice})
      */

      // 2024/05/20: Amoy testnet                        
      // await KWhToken.approveBank( [tokenART, USDC_ADDRESS, USDT_ADDRESS], {gasPrice: defaultGasPrice})
      
      // 2024/05/20: Amoy testnet
      // const ART = ArkreenRECToken__factory.connect(tokenART, deployer);
      // const balanceART = await ART.balanceOf(kWhTokenAddress)
      // await KWhToken.MintKWh( tokenART, balanceART, {gasPrice: defaultGasPrice})
      // const balancekWh = await KWhToken.balanceOf(kWhTokenAddress)
      // console.log("Mint KWh with ART", balanceART.toString(), balancekWh.toString(), badgeInfo)

      // 2024/05/20: Amoy testnet
      // ************* Must upgrade bank contract first ****************
      await KWhToken.changeSwapPrice( tokenART, ART_PRICE, {gasPrice: defaultGasPrice})
      await KWhToken.changeSwapPrice( USDC_ADDRESS, USDC_PRICE, {gasPrice: defaultGasPrice})
      await KWhToken.changeSwapPrice( USDT_ADDRESS, USDT_PRICE, {gasPrice: defaultGasPrice})

      // ************* Must upgrade bank contract first ****************
      /*
      // 2024/05/20: Amoy testnet
      const balancekWhBefore = await KWhToken.balanceOf(kWhTokenAddress)
      const amountUSDC =  BigNumber.from(2).mul(BigNumber.from(10).pow(6))        //2 USDC

      await KWhToken.MintKWh( USDC_ADDRESS, amountUSDC, {gasPrice: defaultGasPrice})

      const amountUSDT =  BigNumber.from(10000).mul(BigNumber.from(10).pow(6))    //10000 USDT
      await KWhToken.MintKWh( USDT_ADDRESS, amountUSDT, {gasPrice: defaultGasPrice})

      const balancekWhAfter = await KWhToken.balanceOf(kWhTokenAddress)
      console.log("Mint KWh with ART", balancekWhBefore.toString(), balancekWhAfter.toString())
      */
    } else if(hre.network.name === 'matic')  {
      tokenART = ""
      artBank = ""
      arkreenBuilder = ""
      offsetManager = ""
    } 


};

// 2024/05/20A: Call setBadgeInfo, MintKWh (ART)
// yarn deploy:matic_test:WKHI    : Amoy testnet (Dev Anv)

// 2024/05/20B: Call approveBank, MintKWh
// yarn deploy:matic_test:WKHI    : Amoy testnet (Dev Anv)

// 2024/05/20C: Call changeSwapPrice (ART/USDC/USDT)
// yarn deploy:matic_test:WKHI    : Amoy testnet (Dev Anv)

// 2024/05/20D: Call MintKWh (USDC/USDT)
// yarn deploy:matic_test:WKHI    : Amoy testnet (Dev Anv)

// 2024/05/20E: Call changeSwapPrice (ART/USDC/USDT)
// yarn deploy:matic_test:WKHI    : Amoy testnet (Dev Anv)

func.tags = ["WKHI"];

export default func;
