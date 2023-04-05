import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { HashKeyESGBTC__factory } from "../../typechain";
import { BigNumber } from 'ethers'

import NFT_pic_metadata from "../NFT_pic.json";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let ESGBTC_ADDRESS
    let USDC_ADDRESS
    let USDT_ADDRESS
    let WMATIC_ADDRESS
    let AKRE_ADDRESS

    if(hre.network.name === 'matic_test')  {    
      // 2023/03/05, simulation 
      //ESGBTC_ADDRESS  = "0xDe8e59dAB27EB97b2267d4230f8FE713A637e03c"         // HashKey ESG BTC address
      ESGBTC_ADDRESS  = "0x785dCa2Ca9a51513da1fef9F70E6B6ab02896F67"         // 2023/3/14 HashKey ESG BTC address

/*            
      USDC_ADDRESS    = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23"        // USDC address
      USDT_ADDRESS    = "0xD89EDB2B7bc5E80aBFD064403e1B8921004Cdb4b"        // USDT address
      WMATIC_ADDRESS  = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"        // WMATIC address
      AKRE_ADDRESS    = "0x54e1c534f59343c56549c76d1bdccc8717129832"        // AKRE address

      const [deployer] = await ethers.getSigners();

      // Approve HashKeyESGBTCContract to Tranfer-From the specified tokens
      const HashKeyESGBTCFactory = HashKeyESGBTC__factory.connect(ESGBTC_ADDRESS as string, deployer);
      
      const approveRouterTx = await HashKeyESGBTCFactory.approveBuilder(
                                        [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] as string[])
      await approveRouterTx.wait()
      console.log("HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, ESGBTC_ADDRESS, 
                                [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] );

*/

      const [deployer] = await ethers.getSigners();

      // Approve HashKeyESGBTCContract to Tranfer-From the specified tokens
      const HashKeyESGBTCFactory = HashKeyESGBTC__factory.connect(ESGBTC_ADDRESS as string, deployer);

//      const level = [1, 2, 3, 4, 5, 6, 7, 8]
//      const limit = [100, 60, 60, 40, 40, 20, 20, 10]

/*
      const level = [1, 2, 3]
      const limit = [100, 60, 60]

      const allMetaCID = level.reduce<string>((allMeta, lvl, idx) => {
                for ( let index=1; index<=limit[idx]; index++) {
                  const key = 'L' + lvl.toString()+ '#' + index.toString().padStart(3,'0')
                  allMeta = allMeta + (NFT_pic_metadata.All_Green_BTC_NFT as any)[key].CID_META
                }
                return allMeta
            }, '')

//      const levelRange = 0x0801
//      const limitList = BigNumber.from("0x0A141428283C3C64")
      
      const levelRange = 0x0301
      const limitList = BigNumber.from("0x3C3C64")

      const updateCIDTx = await HashKeyESGBTCFactory.updateCID(levelRange, limitList, Buffer.from(allMetaCID))
      await updateCIDTx.wait()
      console.log( "HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, ESGBTC_ADDRESS, allMetaCID ); 
*/

      const level = [4, 5, 6, 7, 8]
      const limit = [40, 40, 20, 20, 10]

      const allMetaCID = level.reduce<string>((allMeta, lvl, idx) => {
                for ( let index=1; index<=limit[idx]; index++) {
                  const key = 'L' + lvl.toString()+ '#' + index.toString().padStart(3,'0')
                  allMeta = allMeta + (NFT_pic_metadata.All_Green_BTC_NFT as any)[key].CID_META
                }
                return allMeta
            }, '')
     
      const levelRange = 0x0804
      const limitList = BigNumber.from("0x0A14142828")

      const updateCIDTx = await HashKeyESGBTCFactory.updateCID(levelRange, limitList, Buffer.from(allMetaCID))
      await updateCIDTx.wait()

      console.log( "HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, ESGBTC_ADDRESS, allMetaCID );      

/*
      ////////////////////////////////////////////////////
      // No too much improvement      
      const level = [1, 2, 3, 4, 5, 6, 7, 8]
      const limit = [100, 60, 60, 40, 40, 20, 20, 10]

      const allMetaCID = level.reduce<string>((allMeta, lvl, idx) => {
                for ( let index=1; index<=limit[idx]; index++) {
                  const key = 'L' + lvl.toString()+ '#' + index.toString().padStart(3,'0')
                  allMeta = allMeta + (NFT_pic_metadata.All_Green_BTC_NFT as any)[key].CID_META
                }
                return allMeta
            }, '')

      const updateCIDTx = await HashKeyESGBTCFactory.updateCID(Buffer.from(allMetaCID))
      await updateCIDTx.wait()

      console.log( "HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, ESGBTC_ADDRESS, allMetaCID );      
  */    
    }
    else if(hre.network.name === 'matic')  {        // Matic Mainnet
      ESGBTC_ADDRESS    = "0xfe9341218c7Fcb6DA1eC131a72f914B7C724F200"            // HashKey ESG BTC address

      USDC_ADDRESS      = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"          // USDC address
      USDT_ADDRESS      = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"          // USDT address
      WMATIC_ADDRESS    = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"          // WMATIC address
      AKRE_ADDRESS      = "0x21b101f5d61a66037634f7e1beb5a733d9987d57"          // tAKRE address

      const [deployer] = await ethers.getSigners();

      // Approve HashKeyESGBTCContract to Tranfer-From the specified tokens
      const HashKeyESGBTCFactory = HashKeyESGBTC__factory.connect(ESGBTC_ADDRESS as string, deployer);
      
      // 2023/04/05
      const approveRouterTx = await HashKeyESGBTCFactory.approveBuilder(
                                        [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] as string[])
      await approveRouterTx.wait()
      console.log("HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, ESGBTC_ADDRESS, 
                                [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] );

    } 
                              
};

// 2023/04/03: Add the NFT picture and relative logic
// yarn deploy:matic_test:HskBTCI

// 2023/04/04: call updateCID to update allCID stored in one bytes  
// yarn deploy:matic_test:HskBTCI

// 2023/04/04: call updateCID in the reverted CID logic  
// yarn deploy:matic_test:HskBTCI

// 2023/04/05: call updateCID in the reverted CID logic  
// yarn deploy:matic:HskBTCI

func.tags = ["HskBTCI"];

export default func;
