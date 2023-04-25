import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { HashKeyESGBTC__factory } from "../../typechain";
import { BigNumber } from 'ethers'

import NFT_pic_test_metadata from "../resultTest.json";
import NFT_pic_formal_metadata from "../resultFormal.json";


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

      // Note: Matic test change this ABI; function UpdateESGBadgeLimit(uint256 limit)
      const limit = BigNumber.from('0x14141428283C3C64')
      const count = BigNumber.from('0x0B01020100020413')
      const updateCIDTx = await HashKeyESGBTCFactory.UpdateESGBadgeLimit(limit, count)
      await updateCIDTx.wait()
      console.log("HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, 
                        limit.toHexString(), ESGBTC_ADDRESS, 
                        [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] );

/*                        
//      const level = [1, 2, 3, 4, 5, 6, 7, 8]
//      const limit = [100, 60, 60, 40, 40, 20, 20, 20]     // Last 20 is just for in case over sold

      {
        const level = [1, 2, 3]
        const limit = [100, 60, 60]

        const allMetaCID = level.reduce<string>((allMeta, lvl, idx) => {
                  for ( let index=1; index<=limit[idx]; index++) {
                    const key = 'L' + lvl.toString()+ '#' + index.toString().padStart(3,'0')
                    allMeta = allMeta + (NFT_pic_test_metadata.All_Green_BTC_NFT as any)[key].CID_META
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
      }

      const level = [4, 5, 6, 7, 8]
      const limit = [40, 40, 20, 20, 20]

      const allMetaCID = level.reduce<string>((allMeta, lvl, idx) => {
                for ( let index=1; index<=limit[idx]; index++) {
                  const key = 'L' + lvl.toString()+ '#' + index.toString().padStart(3,'0')
                  allMeta = allMeta + (NFT_pic_test_metadata.All_Green_BTC_NFT as any)[key].CID_META
                }
                return allMeta
            }, '')
     
      const levelRange = 0x0804
      const limitList = BigNumber.from("0x1414142828")

      const updateCIDTx = await HashKeyESGBTCFactory.updateCID(levelRange, limitList, Buffer.from(allMetaCID))
      await updateCIDTx.wait()

      console.log( "HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, ESGBTC_ADDRESS, allMetaCID );      
*/

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

      // 2023/04/10
      // Approve HashKeyESGBTCContract to Tranfer-From the specified tokens
      const HashKeyESGBTCFactory = HashKeyESGBTC__factory.connect(ESGBTC_ADDRESS as string, deployer);

//    zhang: 514642729@qq.com       // OK 0x2ede75766702f34b6157af1bc78db3e4cf60fba2:  15
//    Martin: farmerrock@gmail.com  // OK
//    Vitalii: redemax333@gmail.com // OK
//    ttzwen:	ttzwen@hotmail.com    // OK: 0x4533c5E0271Ff4e1CF254a24F9590007FA18606D : 18
//    Zehao: lizakhho@gmail.com     // OK 0xe1dAdfd20bBCD8779D3cF29Eb07D6085Abd4b8Eb: 19
//    Maxine: 541417213@qq.com      // OK 0x08d2D1f482A17A2FA779a3D4eE4EF7776e2Ba452: 20
//    BH: yinngbh@gmail.com         // OK
//    JEY: huangdaming1990@gmail.com  // OK
//    tommykw: b1463912303@gmail.com  // OK
//    waato: dd29fwyf@gmail.com       // OK 0x4f4e4247CCc329bdd68EB9f1419B234d50803c9e: 24

      const audienceID = [15, 18, 19, 20, 24]
      const audienceAddress = [ '0x2ede75766702f34b6157af1bc78db3e4cf60fba2',
                                '0x4533c5E0271Ff4e1CF254a24F9590007FA18606D',
                                '0xe1dAdfd20bBCD8779D3cF29Eb07D6085Abd4b8Eb',
                                '0x08d2D1f482A17A2FA779a3D4eE4EF7776e2Ba452',
                                '0x4f4e4247CCc329bdd68EB9f1419B234d50803c9e',
                              ]

    // Not executed                              
    for( let index=0; index<5; index++) {                              
      const updateCIDTx = await HashKeyESGBTCFactory.connect(deployer.address).transferFrom(deployer.address, audienceAddress[index], audienceID[index])
      await updateCIDTx.wait()
    }
    console.log("HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, audienceID, audienceAddress );

/*    
      // Note: Matic test change this ABI; function UpdateESGBadgeLimit(uint256 limit)
      const limit = BigNumber.from('0x0000000000000000')
      const count = BigNumber.from('0x0300000000000000')
      const updateCIDTx = await HashKeyESGBTCFactory.UpdateESGBadgeLimit(limit, count)
      await updateCIDTx.wait()
      console.log("HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, 
                        limit.toHexString(), ESGBTC_ADDRESS, 
                        [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] );
*/
                        
/*
      {
        const level = [1, 2, 3]
        const limit = [100, 60, 60]

        const allMetaCID = level.reduce<string>((allMeta, lvl, idx) => {
                  for ( let index=1; index<=limit[idx]; index++) {
                    const key = 'L' + lvl.toString()+ '#' + index.toString().padStart(3,'0')
                    allMeta = allMeta + (NFT_pic_formal_metadata.All_Green_BTC_NFT as any)[key].CID_META
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
      }

      const level = [4, 5, 6, 7, 8]
      const limit = [40, 40, 20, 20, 20]

      const allMetaCID = level.reduce<string>((allMeta, lvl, idx) => {
                for ( let index=1; index<=limit[idx]; index++) {
                  const key = 'L' + lvl.toString()+ '#' + index.toString().padStart(3,'0')
                  allMeta = allMeta + (NFT_pic_formal_metadata.All_Green_BTC_NFT as any)[key].CID_META
                }
                return allMeta
            }, '')
     
      const levelRange = 0x0804
      const limitList = BigNumber.from("0x1414142828")

      const updateCIDTx = await HashKeyESGBTCFactory.updateCID(levelRange, limitList, Buffer.from(allMetaCID))
      await updateCIDTx.wait()

      console.log( "HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, ESGBTC_ADDRESS, allMetaCID );      
*/
      
/*      
      // 2023/04/05
      const approveRouterTx = await HashKeyESGBTCFactory.approveBuilder(
                                        [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] as string[])
      await approveRouterTx.wait()
      console.log("HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, ESGBTC_ADDRESS, 
                                [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] );
*/                                

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

// 2023/04/09: call updateCID in new QRCode of https://www.greenbtc.club
// yarn deploy:matic_test:HskBTCI

// 2023/04/11: call updateCID for formal release
// yarn deploy:matic:HskBTCI

// 2023/04/11: call UpdateESGBadgeLimit
// yarn deploy:matic_test:HskBTCI

// 2023/04/11: call UpdateESGBadgeLimit
// yarn deploy:matic:HskBTCI

func.tags = ["HskBTCI"];

export default func;
