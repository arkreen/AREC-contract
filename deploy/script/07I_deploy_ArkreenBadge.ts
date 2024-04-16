import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ArkreenBadge__factory } from "../../typechain";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(100_000_000_000)

    const [deployer] = await ethers.getSigners();

    if(hre.network.name === 'matic_test')  {   
//      const PROXY_ADDRESS = "0x5C653b445BE2bdEB6f8f3CD099FC801865Cab835"      // Need to check: Simu mode
//      const IMAGE_URL = '0x65c78eaC38aa9B5eaa871d6cd22598E011aC1164'          // 2024/01/01: Image contract supporting image url

      const PROXY_ADDRESS = "0x8a459D94F30dB4FC5b6e8F1950d67287AF0Bc77C"      // Need to check: Amoy Dev
      const IMAGE_URL = '0xd10eA37C185CC3eaA952b3c27D5ec754d40C1741'          // 2024/04/16(Amoy dev): Image contract supporting image url

      const  ArkreenBadgeFactory = ArkreenBadge__factory.connect(PROXY_ADDRESS, deployer);

      const updateTx = await  ArkreenBadgeFactory.setBadgeImage(IMAGE_URL, {gasPrice: defaultGasPrice})
      await updateTx.wait()
      console.log("callData, update", updateTx)
      console.log(" ArkreenBadge updated to %s: ", hre.network.name,  ArkreenBadgeFactory.address);

      //const image = await  ArkreenBadgeFactory.tokenURI(161)
      //console.log(" ArkreenBadge updated to %s: ", hre.network.name,  ArkreenBadgeFactory.address, image);
      
    }
    else if(hre.network.name === 'matic')  {                                  // Matic Mainnet for test
      // const PROXY_ADDRESS = "0x3d5531cF0bC2e8d0658fEc0D1a9995211Ac1f337"   // Need to check
      const PROXY_ADDRESS = "0x1e5132495cdaBac628aB9F5c306722e33f69aa24"      // Need to check, Mainnet Launch

      const IMAGE_URL = '0x9b2987e8B169402B535efF2d328440593b8B5240'          // 2024/02/22: Image contract supporting image url

      const  ArkreenBadgeFactory = ArkreenBadge__factory.connect(PROXY_ADDRESS, deployer);

      const updateTx = await ArkreenBadgeFactory.setBadgeImage(IMAGE_URL, {gasPrice: defaultGasPrice})
      await updateTx.wait()

      console.log("callData, update", updateTx)
      console.log(" ArkreenBadge updated to %s: ", hre.network.name,  ArkreenBadgeFactory.address);

      const image = await ArkreenBadgeFactory.tokenURI(321)
      console.log(" ArkreenBadge updated to %s: ", hre.network.name,  ArkreenBadgeFactory.address, image);

      /*
      let PROXY_ADDRESS
      let tokenIDList: number[] = []
      let metaDatList: string[] = []

      tokenIDList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      metaDatList = [ 'bafkreiefvf5z6zhpr2ppfsdfw2s7ca5pwkrpznrjbgy2m6ywx6txrf7hce',
                      'bafkreidy45rqsygk74my4yawwecscz4afm3ufscwsapne5abyglcji3x4m',
                      'bafkreidfc33ltms4kteeirne7n3vwr3y3xwwaeice2uiynqzwd7dgdvbe4',
                      'bafkreif4sjf6jn54qwfpne43xqc7rrqi2zlf4yvzqxq5h6zqkand6htlti',
                      'bafkreidpauimkfc4zm63x2f2vhw5rt2ohovnody52e2p7suu4r2mqvgr44',
                      'bafkreifq5zbqrvth2xphz6wljvnzq6njitk747c4iygushdzrjiabr4mu4',
                      'bafkreieaisgq4amp7ikh775yvu6guq4vdhejtsciyt4ii5mzs4u3foa2wy',
                      'bafkreih4xggib5rhk2bm4ievxg6v2wuwhccfcrhloytf4jz4zngswqfsyi',
                      'bafkreih2sjqcpgfglyd5bg7ew4gynvpljmogv3bkemvochloogpkgbb6pi',
                      'bafkreihfv24u4fykvzb4db4ync57rabx7cwmkzqvncxltbcccwhaaaewrm'
                    ]
      */

      /*    
          // 2023/04/03
          const ArkreenBadgeFactory = ArkreenBadge__factory.connect(PROXY_ADDRESS as string, deployer);
          const updateCIDTx = await ArkreenBadgeFactory.updateCID(tokenIDList, metaDatList)
          await updateCIDTx.wait()
          console.log("ArkreenBadge updateCID is executed: ", hre.network.name, new Date().toLocaleString(),
                                          tokenIDList, metaDatList );    
      */                    
    } 

};

// 2023/04/02: yarn deploy:matic:RECBadgeI
// Updated CID to ArkreenBadge contract to test NFT picture

// 2024/01/01: yarn deploy:matic_test:RECBadgeI
// Update image contract supporting image url:  0x65c78eaC38aa9B5eaa871d6cd22598E011aC1164

// 2024/02/22: yarn deploy:matic:RECBadgeI
// Update image contract supporting image url:  0x9b2987e8B169402B535efF2d328440593b8B5240

// 2024/04/16: yarn deploy:matic_test:RECBadgeI
// Update image contract supporting image url:  0xd10eA37C185CC3eaA952b3c27D5ec754d40C1741

func.tags = ["RECBadgeI"];

export default func;
