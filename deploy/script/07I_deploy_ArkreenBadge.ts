import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ArkreenBadge__factory } from "../../typechain";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let PROXY_ADDRESS
    let tokenIDList: number[] = []
    let metaDatList: string[] = []

    if(hre.network.name === 'matic_test')  {   
      PROXY_ADDRESS = ''
      tokenIDList = []
      metaDatList = []
    }
    else if(hre.network.name === 'matic')  {                                  // Matic Mainnet for test
      PROXY_ADDRESS = "0x3d5531cF0bC2e8d0658fEc0D1a9995211Ac1f337"            // Need to check

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
    } 

    const [deployer] = await ethers.getSigners();

    // 2023/04/03
    const ArkreenBadgeFactory = ArkreenBadge__factory.connect(PROXY_ADDRESS as string, deployer);
    const updateCIDTx = await ArkreenBadgeFactory.updateCID(tokenIDList, metaDatList)
    await updateCIDTx.wait()
    console.log("ArkreenBadge updateCID is executed: ", hre.network.name, new Date().toLocaleString(),
                                    tokenIDList, metaDatList );    

};

// 2023/04/02: yarn deploy:matic:RECBadgeI
// Updated CID to ArkreenBadge contract to test NFT picture

func.tags = ["RECBadgeI"];

export default func;
