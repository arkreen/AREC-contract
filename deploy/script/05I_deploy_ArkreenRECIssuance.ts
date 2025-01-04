import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRECIssuanceExt__factory } from "../../typechain";
import { ArkreenRECIssuance__factory } from "../../typechain";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const [deployer, controller] = await ethers.getSigners();
    console.log("Updating ArkreenRECIssuance: ", CONTRACTS.RECIssuance, deployer.address);  

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(50_000_000_000)

//    Cannot be verified in this way    
//    const ArkreenRECIssuanceFactory = await ethers.getContractFactory("ArkreenRECIssuance");
//    const ArkreenRECIssuance_Upgrade = await ArkreenRECIssuanceFactory.deploy();
//    await ArkreenRECIssuance_Upgrade.deployed();

    if(hre.network.name === 'matic_test') {
      
//      const REC_ISSUANCE_ADDRESS = "0x95f56340889642a41b913c32d160d2863536e073"       // Need to check  // Simu mode
//      const REC_ISSUANCE_ADDRESS = "0x7370c2166D7720c41F0931f0bbF67e10d00B0D18"       // Need to check  // Matic testnet
//      const REC_ISSUANCE_ADDRESS = "0x32Dbe18BBc2C752203b6e1bE87EdE5655A091dFa"       // Need to check  // Dev environment // 2023/12/12
//      const REC_ISSUANCE_ADDRESS = "0x9745918BAF66e3634502bF9a6C07AD320291D211"       // 2023/06/08: Pre-production Env
        const REC_ISSUANCE_ADDRESS = "0x4fc1d9188610377eA22C577054Fe42627eE49459"       // 2024/04/15 // Ploygon Amoy testnet

        const [deployer] = await ethers.getSigners();
        const ArkreenRECIssuanceFactory = ArkreenRECIssuance__factory.connect(REC_ISSUANCE_ADDRESS, deployer);     
        const ArkreenRECIssuanceExtFactory = ArkreenRECIssuanceExt__factory.connect(REC_ISSUANCE_ADDRESS, deployer);

/*          
        // 2023/03/28, 2024/04/15
        // function setESGExtAddress(address addrESGExt)         
//      const REC_ISSUANCE_EXT_ADDRESS  = "0x53abcbfc0818039bac5f72429af025eaf566b624"        // 2023/03/28, reuse simu deployment
//      const REC_ISSUANCE_EXT_ADDRESS  = "0x0babee40f62d946d5de5beec48c5c4c453c6b1f0"        // 2023/04/02, bug in cancelRECRequest corrected
//      const REC_ISSUANCE_EXT_ADDRESS  = "0x0babee40f62d946d5de5beec48c5c4c453c6b1f0"        // 2023/05/09, reuse for dev environment
//      const REC_ISSUANCE_EXT_ADDRESS  = "0x0bABeE40F62D946d5DE5beEC48C5C4c453C6b1F0"        // 2023/06/08, reuse for dev environment
        const REC_ISSUANCE_EXT_ADDRESS  = "0xC409b1c8809e7af02c01FcC0084a3fd89f703609"        // 2024/04/15, Amoy testnet
        
        // 2023/06/08, 2024/04/15 
        const updateTx = await ArkreenRECIssuanceFactory.setESGExtAddress(REC_ISSUANCE_EXT_ADDRESS)
        await updateTx.wait()     

        console.log("callData, update", updateTx)
        console.log("ArkreenRECIssuance: set ESGExt address to %s: ", hre.network.name, ArkreenRECIssuanceFactory.address,
                                                                    REC_ISSUANCE_EXT_ADDRESS );
*/


//      const MVP_ADDRESS = "0x8d832f73D678cFd2dA04401b18973Ed146Db1ABA"                // (2023/2/26): Simu mode, MVP address, account 6

        // 2024/04/16 (Amoy testnet)
        const MVP_ADDRESS1 = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"               // (2023/2/27): Simu mode, MVP address, account 1
        const MVP_ADDRESS2 = "0xB53B96e1eF29cB14313c18Fa6374AB87df59BcD9"               // (2023/2/27): Simu mode, MVP address, account 2
        const MVP_ADDRESS3 = "0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"               // (2023/2/27): Simu mode, MVP address, account 3
        const MVP_ADDRESS4 = "0xC6A7E203c458B58C85aeCD2965de1fA8aa44847E"               // (2023/12/12): Dev env, MVP address, account 4

        // function manageMVPAddress(bool op, address[] calldata listMVP) 
        // 1. 2023/03/28
        // const updateTx = await ArkreenRECIssuanceExtFactory.manageMVPAddress(true, [MVP_ADDRESS1, MVP_ADDRESS2, MVP_ADDRESS3])
        
        // 2023/12/12, 2024/04/16
        const updateTx = await ArkreenRECIssuanceExtFactory.manageMVPAddress(true, [MVP_ADDRESS1, MVP_ADDRESS2, MVP_ADDRESS3, MVP_ADDRESS4])
        await updateTx.wait()
        console.log("ArkreenRECIssuance: updateARECMintPrice:", hre.network.name, ArkreenRECIssuanceExtFactory.address,
                                MVP_ADDRESS1, MVP_ADDRESS2, MVP_ADDRESS3, MVP_ADDRESS4, {gasPrice: defaultGasPrice} );   

/*
//      const IMAGE_URL_ADDRESS = "0x5F8dE063558Ffb782760A0dC6de6108c4387356e"               // (2024/01/01A): Update Image URL Contract
//      const IMAGE_URL_ADDRESS = "0xB4B19F8381bf6a44CDc8591294683Bf21C8997cb"               // (2024/01/01B): Fix bug
//      const IMAGE_URL_ADDRESS = "0xA881049ba78A8f1b314AaF557C507332cC5D7DD8"               // (2024/02/23): To Add Arkreen logo
        const IMAGE_URL_ADDRESS = "0xD5e8666620eaf809D32c5F2D739C49953FBd6e12"               // (2024/04/15): To Add Arkreen logo (Amoy Testnet)

        // 2024/01/01A, 2024/01/01B, 2024/02/23, 2024/05/16
        const updateTx = await ArkreenRECIssuanceFactory.setARECImage(IMAGE_URL_ADDRESS)
        await updateTx.wait()
        console.log("ArkreenRECIssuance: updateARECMintPrice:", hre.network.name, 
                        ArkreenRECIssuanceFactory.address, IMAGE_URL_ADDRESS, {gasPrice: defaultGasPrice});

//        const imageUrl = await ArkreenRECIssuanceFactory.tokenURI(287)
//        console.log("ArkreenRECIssuance: updateARECMintPrice:", hre.network.name, imageUrl)
*/

/*
      // 2023/05/09, 2023/06/08, 2024/04/16
      // const AKREToken_ADDRESS      = "0x8Ab2299351585097101c91FE4b098d95c18D28a7"        // 2023/05/09: gAKRE
      // const AKREToken_ADDRESS      = "0xc83DEd2B70F25C0EB0ef1cDE993DEaA3fAE91314"        // 2023/06/08: tAKRE
      const AKREToken_ADDRESS         = "0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206"        // 2024/04/16: AKRE (Amoy Dev)

      const AKREToken_PRICE           = BigNumber.from(100_000_000_000)                     // 2023/05/09: 10**11, 2024/04/16

      // function updateARECMintPrice(address token, uint256 price)
      const updateTx = await ArkreenRECIssuanceFactory.updateARECMintPrice(AKREToken_ADDRESS, AKREToken_PRICE, {gasPrice: defaultGasPrice})
      await updateTx.wait()

      console.log("ArkreenRECIssuance: updateARECMintPrice:", hre.network.name, ArkreenRECIssuanceFactory.address,
                                                                  AKREToken_ADDRESS, AKREToken_PRICE ); 
*/                            
    } 

    if(hre.network.name === 'matic') {
//    const REC_ISSUANCE_ADDRESS      = "0x45D0c0E2480212A60F1a9f2A820F1d7d6472CA6B"        // Need to check, Version Test
      const REC_ISSUANCE_ADDRESS      = "0x954585adF9425F66a0a2FD8e10682EB7c4F1f1fD"        // 2023/03/22, 2024/02/27

      const [deployer] = await ethers.getSigners();
      const ArkreenRECIssuanceFactory = ArkreenRECIssuance__factory.connect(REC_ISSUANCE_ADDRESS, deployer);
//    const ArkreenRECIssuanceExtFactory = ArkreenRECIssuanceExt__factory.connect(REC_ISSUANCE_ADDRESS, deployer);           

      /////////////////////////////////////////////////////////
      // 2023/04/02
//    const tARKRE_TOKEN_ADDRESS = "0xA906175C2f72BB2D8d16427dda524CBD324Cc510"

      // 2023/04/04
//    const tARKRE_TOKEN_ADDRESS = "0x21B101f5d61A66037634f7e1BeB5a733d9987D57"
//    const updateTx = await ArkreenRECIssuanceExtFactory.setTokenAKRE(tARKRE_TOKEN_ADDRESS)
//    await updateTx.wait()          

      /////////////////////////////////////////////////////////
//    const REC_ISSUANCE_EXT_ADDRESS  = "0x677174509c37c91e6675f6203608195c456d8b13"        // 2023/03/22
//    const REC_ISSUANCE_EXT_ADDRESS  = "0x5CdcCdBcCC590893344933003628Ac9B29e593Dd"        // 2023/04/02
      const REC_ISSUANCE_EXT_ADDRESS  = "0x1639E024db1234a543bF70526974490b428C0E1f"        // 2025/01/04

      // 2023/03/22, 2025/01/04
      // function setESGExtAddress(address addrESGExt) 
    const updateTx = await ArkreenRECIssuanceFactory.setESGExtAddress(REC_ISSUANCE_EXT_ADDRESS)
    await updateTx.wait()      

      /////////////////////////////////////////////////////////
//    const AKREToken_ADDRESS         = "0x960C67B8526E6328b30Ed2c2fAeA0355BEB62A83"        // 2023/03/22: gAKRE
//    const AKREToken_ADDRESS         = "0x21B101f5d61A66037634f7e1BeB5a733d9987D57"        // 2023/05/22: tAKRE
      const AKREToken_ADDRESS         = "0xE9c21De62C5C5d0cEAcCe2762bF655AfDcEB7ab3"        // 2024/02/27: AKRE

//    const AKREToken_PRICE           = BigNumber.from(100000000000)                        // 2023/03/22: 10**11, 2024/02/27
//    const AKREToken_PRICE           = BigNumber.from(1000000000000)                       // 2024/10/01: 10**12, 1 AREC = 1000 AKRE

/*
      // 2023/03/22
      // function updateARECMintPrice(address token, uint256 price)
//    const updateTx = await ArkreenRECIssuanceExtFactory.updateARECMintPrice(AKREToken_ADDRESS, AKREToken_PRICE)
//    await updateTx.wait()      
*/

/*
      // 2023/05/22
      // function updateARECMintPrice(address token, uint256 price)
      console.log("ArkreenRECIssuance Update Mint Price:", hre.network.name, AKREToken_ADDRESS, AKREToken_PRICE);
      const updateTx = await ArkreenRECIssuanceExtFactory.updateARECMintPrice(AKREToken_ADDRESS, AKREToken_PRICE)
      await updateTx.wait()      

      {
        // 2023/05/22
        // Remove the old gARKE
        const AKREToken_ADDRESS_OLD = "0x960C67B8526E6328b30Ed2c2fAeA0355BEB62A83"        // 2023/05/22: gAKRE
        console.log("ArkreenRECIssuance Remove Mint Price:", hre.network.name, AKREToken_ADDRESS_OLD);
        const updateTx = await ArkreenRECIssuanceExtFactory.updateARECMintPrice(AKREToken_ADDRESS_OLD, 0)
        await updateTx.wait()    
      }
*/

/*
      {
        // 2024/02/27
        // Remove the tAKRE
        const AKREToken_ADDRESS_OLD = "0x21B101f5d61A66037634f7e1BeB5a733d9987D57"
        console.log("ArkreenRECIssuance Remove Mint Price:", hre.network.name, AKREToken_ADDRESS_OLD);
        const updateTx = await ArkreenRECIssuanceFactory.updateARECMintPrice(AKREToken_ADDRESS_OLD, 0, {gasPrice: defaultGasPrice})
        await updateTx.wait()    
      }
      
      {
        // 2024/02/27
        const updateTx = await ArkreenRECIssuanceFactory.setTokenAKRE(AKREToken_ADDRESS, {gasPrice: defaultGasPrice} )
        await updateTx.wait()        
      }
*/

/*
      {
        // 2024/02/27, 2024/10/01
        // function updateARECMintPrice(address token, uint256 price)
        console.log("ArkreenRECIssuance Update Mint Price:", hre.network.name, AKREToken_ADDRESS, AKREToken_PRICE);
        const updateTx = await ArkreenRECIssuanceFactory.updateARECMintPrice(AKREToken_ADDRESS, AKREToken_PRICE, {gasPrice: defaultGasPrice} )
        await updateTx.wait()      
      }
*/

/*
      {
        // 2024/03/30

        // function updateARECMintPrice(address token, uint256 price)
        // function updateRECData(uint256 tokenID, address issuer, string memory region, string memory url, string memory memo)
        const tokenID = 5863
        const issuer = "0xfedd52848cb44dcdba95df4cf2bcbd71d58df879"
        const region = ""
        const url = ""
        const memo = ""

        console.log("ArkreenRECIssuance Update Mint Price:", hre.network.name, tokenID, issuer, region, url, memo);
        
        const callData = ArkreenRECIssuanceFactory.interface.encodeFunctionData("updateRECData", 
                                                                      [tokenID, issuer, region, url, memo])
                
        const updateTx = await ArkreenRECIssuanceFactory.connect(controller).updateRECData(tokenID, issuer, region, url, memo, {gasPrice: defaultGasPrice} )
        await updateTx.wait()      
        
        console.log("ArkreenRECIssuance Update Mint Price:", hre.network.name, tokenID, issuer, region, url, memo, callData);
      }
*/        

/*
      //////////////////////////////////////////////////////
      // 2023/04/04, 2023/10/18
      // function manageMVPAddress(bool op, address[] calldata listMVP) 
      // const MVP_ADDRESS = "0x8bCe3621901909851ba5579060D9058Ef489a9EF"   // 2023/04/04
      const MVP_ADDRESS = "0x1249B1eABcAE642CF3Cb1e512a0075CEe92769BE"      // 2023/10/18

      const updateTx = await ArkreenRECIssuanceExtFactory.manageMVPAddress(true, [MVP_ADDRESS], {gasPrice: BigNumber.from(100_000_000_000)})
      await updateTx.wait()

      console.log("callData, update", updateTx)
      console.log("ArkreenRECIssuance Updated to %s: ", hre.network.name, ArkreenRECIssuanceExtFactory.address);
*/

      //////////////////////////////////////////////////////
/*      
      const IMAGE_URL_ADDRESS = "0xf1c78E697440Ff8eECDf411E7CeC3fF26957971b"               // (2024/02/24): To Add Arkreen logo

      // 2024/02/024
      const updateTx = await ArkreenRECIssuanceFactory.setARECImage(IMAGE_URL_ADDRESS)
      await updateTx.wait()
      console.log("ArkreenRECIssuance: updateARECMintPrice:", hre.network.name, 
                                            ArkreenRECIssuanceFactory.address, IMAGE_URL_ADDRESS);

      const imageUrl = await ArkreenRECIssuanceFactory.tokenURI(1000)
      console.log("ArkreenRECIssuance: updateARECMintPrice:", hre.network.name, imageUrl)
*/

  } 

    if(hre.network.name === 'celo_test') {
      
        const REC_ISSUANCE_ADDRESS = "0x66e9c20DE3711e7C8c886d461aACd6E092E161BE"       // Celo testnet: 2023/08/21
    
        const [deployer] = await ethers.getSigners();
        const ArkreenRECIssuanceFactory = ArkreenRECIssuance__factory.connect(REC_ISSUANCE_ADDRESS, deployer);         
        const ArkreenRECIssuanceExtFactory = ArkreenRECIssuanceExt__factory.connect(REC_ISSUANCE_ADDRESS, deployer);    
          
/*        
        // 2023/08/21
        // function setESGExtAddress(address addrESGExt)
        // const REC_ISSUANCE_EXT_ADDRESS  = "0x42d4eff140e9903F682DC11931aD3E1437D7ACA1"        // 2023/08/21, addrESGExt
        // const REC_ISSUANCE_EXT_ADDRESS  = "0xCA308f3082729D5960f8726593F15686AA49FCbc"        // 2023/08/31, addrESGExt  
        const REC_ISSUANCE_EXT_ADDRESS  = "0x31ad3b7DC83bc00C321E927dE11AD313eEB9C07e"           // 2023/08/31/02, addrESGExt  

        // 2023/08/21, 2023/08/31/01,  2023/08/31/02
        const updateTx = await ArkreenRECIssuanceFactory.setESGExtAddress(REC_ISSUANCE_EXT_ADDRESS)
        await updateTx.wait()
    
        console.log("callData, update", updateTx)
        console.log("ArkreenRECIssuance: set Ext address to %s: ", hre.network.name, ArkreenRECIssuanceFactory.address,
                                                                        REC_ISSUANCE_EXT_ADDRESS );
*/
                                                                        
        // 2023/09/27
//      const MVP_ADDRESS1 = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"               // (2023/8/25): Celo test MVP address, account 1
//      const MVP_ADDRESS2 = "0xB53B96e1eF29cB14313c18Fa6374AB87df59BcD9"               // (2023/8/25): Celo test MVP address, account 2
//      const MVP_ADDRESS3 = "0x576Ab950B8B3B18b7B53F7edd8A47986a44AE6F4"               // (2023/8/25): Celo test MVP address, account 3

//      const MVP_ABBA      = "0xeBD4B52B6412EA0dc162EE658de8761E9F248B83"               // (2023/9/27): Celo test MVP address, Abba 1
//      const MVP_ABBA      = "0xe655983fCD0A36E5b6c1401E53586968242b4E0b"               // (2023/9/27): Celo test MVP address, Abba 2
//      const MVP_TEST      = "0x571b9911448b1FC4f93Abf48cEC437Df97cf1E2E"               // (2023/9/27): Celo test MVP address, Me Test
        const MVP_DEV_ENV   = "0xC6A7E203c458B58C85aeCD2965de1fA8aa44847E"               // (2023/9/27): Celo test MVP address, Me Test
        
        // function manageMVPAddress(bool op, address[] calldata listMVP) 
        // 1. 2023/08/25
//      const updateTx = await ArkreenRECIssuanceExtFactory.manageMVPAddress(true, [MVP_ADDRESS1, MVP_ADDRESS2, MVP_ADDRESS3])
//      const updateTx = await ArkreenRECIssuanceExtFactory.manageMVPAddress(true, [MVP_ABBA], {gasPrice: BigNumber.from(100_000_000_000)})

        // 2023/12/12
        const updateTx = await ArkreenRECIssuanceExtFactory.manageMVPAddress(true, [MVP_DEV_ENV], {gasPrice: BigNumber.from(100_000_000_000)})
        await updateTx.wait()

        console.log("callData, update", updateTx)
//      console.log("ArkreenRECIssuance manageMVPAddress %s: ", hre.network.name, ArkreenRECIssuanceExtFactory.address, MVP_ADDRESS1, MVP_ADDRESS2, MVP_ADDRESS3);        
//      console.log("ArkreenRECIssuance manageMVPAddress %s: ", hre.network.name, ArkreenRECIssuanceExtFactory.address, MVP_ABBA, MVP_TEST);        
        console.log("ArkreenRECIssuance manageMVPAddress %s: ", hre.network.name, ArkreenRECIssuanceExtFactory.address, MVP_DEV_ENV);        
    
  } 

  if(hre.network.name === 'celo') {
      
    const REC_ISSUANCE_ADDRESS = "0xbB4b287Fdd601662eCf17fB6EDF3943A15D1b63e"       // Celo Mainnet: 2023/10/31

    const [deployer] = await ethers.getSigners();
    const ArkreenRECIssuanceFactory = ArkreenRECIssuance__factory.connect(REC_ISSUANCE_ADDRESS, deployer);         
    const ArkreenRECIssuanceExtFactory = ArkreenRECIssuanceExt__factory.connect(REC_ISSUANCE_ADDRESS, deployer);    
      
    // 2023/10/31
    // function setESGExtAddress(address addrESGExt)
    const REC_ISSUANCE_EXT_ADDRESS  = "0xD718fcC418e835C8dB91BbB9B90e2F9a6833EbAA"           // 2023/10/31, addrESGExt  

/*    
    // 2023/10/31
    const setESGExtAddressTx = await ArkreenRECIssuanceFactory.setESGExtAddress(REC_ISSUANCE_EXT_ADDRESS)
    await setESGExtAddressTx.wait()

    console.log("callData setESGExtAddress", setESGExtAddressTx)
    console.log("ArkreenRECIssuance: set Ext address to %s: ", hre.network.name, ArkreenRECIssuanceFactory.address,
                                                                    REC_ISSUANCE_EXT_ADDRESS );
*/

      //////////////////////////////////////////////////////
      // 2023/11/01
      // function manageMVPAddress(bool op, address[] calldata listMVP) 
/*      
      const MVP_ADDRESS = "0x1249B1eABcAE642CF3Cb1e512a0075CEe92769BE"            // 2023/11/01

      const updateTx = await ArkreenRECIssuanceExtFactory.manageMVPAddress(true, [MVP_ADDRESS])
      await updateTx.wait()

      console.log("callData, update", updateTx)
      console.log("ArkreenRECIssuance Updated to %s: ", hre.network.name, ArkreenRECIssuanceExtFactory.address, MVP_ADDRESS);  
*/ 

      interface UpdateRECDataExtData {
                                        tokenID: BigNumber
                                        startTime: BigNumber
                                        endTime: BigNumber
                                        cID: string
                                        region: string
                                        url: string 
                                        memo: string
                                      }


    let updateRECDataExtData: UpdateRECDataExtData = {
      tokenID:    BigNumber.from(0),
      startTime:  BigNumber.from(0),
      endTime:    BigNumber.from(0),
      cID:        '',
      region:     '',
      url:        '',
      memo:       ''
    }

    const updateTx = await ArkreenRECIssuanceExtFactory.updateRECDataExt(
                        updateRECDataExtData.tokenID, 
                        updateRECDataExtData.startTime, 
                        updateRECDataExtData.endTime, 
                        updateRECDataExtData.cID, 
                        updateRECDataExtData.region, 
                        updateRECDataExtData.url, 
                        updateRECDataExtData.memo
                      )
    await updateTx.wait()

    console.log("callData, update", updateTx)
    console.log("ArkreenRECIssuance Updated to %s: ", hre.network.name, ArkreenRECIssuanceExtFactory.address);  

  } 

};

// 2023/03/28： Called setESGExtAddress, Must call setESGExtAddress First
// 2023/03/28： Called manageMVPAddress
// 2023/04/02： Called setESGExtAddress in Matic testnet
// 2023/04/02： yarn deploy:matic:RECIssueI :  Called setESGExtAddress in Matic mainnet
// 2023/04/02： yarn deploy:matic:RECIssueI :  Called setTokenAKRE in Matic mainnet

// 2023/04/04： Called manageMVPAddress
// yarn deploy:matic:RECIssueI

// 2023/04/04： Called setTokenAKRE: update new tAKRE
// yarn deploy:matic:RECIssueI

// 2023/05/09： Called setESGExtAddress, Must call setESGExtAddress First
// yarn deploy:matic_test:RECIssueI

// 2023/05/09： Called updateARECMintPrice
// yarn deploy:matic_test:RECIssueI

// 2023/05/22： Called updateARECMintPrice: Add new tAKRE and remove old gAKRE
// yarn deploy:matic:RECIssueI
// Script always overtime, done by calling in explorer

// 2023/06/08： Called setESGExtAddress, Must call setESGExtAddress First
// yarn deploy:matic_test:RECIssueI

// 2023/06/08： Called updateARECMintPrice
// yarn deploy:matic_test:RECIssueI

// 2023/08/21： Called setESGExtAddress, Must call setESGExtAddress First
// yarn deploy:celo_test:RECIssueI

// 2023/08/25： Called manageMVPAddress to add 3 MVP addresses
// yarn deploy:celo_test:RECIssueI

// 2023/08/31： Called setESGExtAddress, Set new delopyed ArkreenRECIssuanceExt address to support approved payment
// yarn deploy:celo_test:RECIssueI

// 2023/08/31/02： Called setESGExtAddress, Upgrade to skip payment value check while it is zero.
// yarn deploy:celo_test:RECIssueI

// 2023/09/27： Called manageMVPAddress to add Abba 
// yarn deploy:celo_test:RECIssueI

// 2023/09/27： Called manageMVPAddress to add Abba 2 and MVP_TEST
// yarn deploy:celo_test:RECIssueI

// 2023/10/18： Called manageMVPAddress: 0x1249B1eABcAE642CF3Cb1e512a0075CEe92769BE
// yarn deploy:matic:RECIssueI

// 2023/10/31： Called setESGExtAddress, Must call setESGExtAddress First
// yarn deploy:celo:RECIssueI

// 2023/11/01： Called manageMVPAddress
// yarn deploy:celo:RECIssueI

// 2023/12/12： Called manageMVPAddress: Add Issuer address for Dev env on matic testnet
// yarn deploy:matic_test:RECIssueI

// 2023/12/12： Called manageMVPAddress: Add Issuer address for Dev env on celo testnet
// yarn deploy:celo_test:RECIssueI

// 2024/01/01A： Called setARECImage: 0x5F8dE063558Ffb782760A0dC6de6108c4387356e
// yarn deploy:matic_test:RECIssueI

// 2024/01/01B： Called setARECImage: 0xB4B19F8381bf6a44CDc8591294683Bf21C8997cb
// yarn deploy:matic_test:RECIssueI

// 2024/02/23： Called setARECImage: 0xA881049ba78A8f1b314AaF557C507332cC5D7DD8
// yarn deploy:matic_test:RECIssueI

// 2024/02/24： Called setARECImage: 0xf1c78E697440Ff8eECDf411E7CeC3fF26957971b
// yarn deploy:matic:RECIssueI

// 2024/02/27： Called updateARECMintPrice(remove tKARE)/ setTokenAKRE(AKRE）/ updateARECMintPrice (add tAKRE)
// yarn deploy:matic:RECIssueI

// 2024/03/30： Called updateRECData to update the REC data (UART)
// yarn deploy:matic:RECIssueI

// 2024/04/15： Called setESGExtAddress, Must call setESGExtAddress First
// yarn deploy:matic_test:RECIssueI

// 2024/04/16A： Called setARECImage (Emoy testnet)
// yarn deploy:matic_test:RECIssueI

// 2024/04/16B： Called updateARECMintPrice (Emoy testnet)
// yarn deploy:matic_test:RECIssueI

// 2024/04/16C： Called manageMVPAddress: Add Issuer address for Amoy testnet
// yarn deploy:matic_test:RECIssueI

// 2024/10/01： Called updateARECMintPrice to change the issuance price to 1 AREC = 1000 AKRE
// yarn deploy:matic:RECIssueI

// 2025/01/04： Called setESGExtAddress
// yarn deploy:matic:RECIssueI

func.tags = ["RECIssueI"];

export default func;
