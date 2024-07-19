
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { StakingRewards__factory } from "../../typechain";
import { GreenBTC2S__factory } from "../../typechain";
import { getGreenBitcoinClaimGifts, getGreenBitcoinClaimGiftsRaw  } from '../../test/utils/utilities'
import { ecsign, fromRpcSig, ecrecover } from 'ethereumjs-util'

import { BigNumber, utils } from "ethers";
import { config as dotEnvConfig } from "dotenv"

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer, signer] = await ethers.getSigners();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(75_000_000_000)

   
  if(hre.network.name === 'matic_test') {
    // 2024/07/05
    //const GreenBTC2SAddress  = "0xf276AD41bA60e723188496318Ba0E41733C9fF3F"        // 2024/07/05: Amoy testnet: Lite Version
    const GreenBTC2SAddress  = "0x6729b2956e8Cf3d863517E4618C3d8722548D5C4"          // 2024/07/18: Amoy testnet: Change the lucky ratio handling method

    const GreenBTC2S = GreenBTC2S__factory.connect(GreenBTC2SAddress, deployer);
    
    // 2024/07/05: Amoy testnet
    // const domainId = 68
    // const domainInfo = "0x0303060600000bb8000f00c803e8000001f405dc000000000800000000000000"

    // 2024/07/18: Amoy testnet
    const domainId = 1

    const domainInfoJson = {
                            x: 0,  y: 320, w:  64, h: 64,
                            boxTop: 669611,
                            chance1: 655,   chance2: 655, chance3: 2621, chance4: 2621,
                            ratio1: 2621,   ratio2: 6554, ratio3: 24904, ratio4: 24905,
                            decimal: 7
                          }

    const domainInfoBigInt= BigNumber.from(domainInfoJson.x / 16).shl(248)
                              .add(BigNumber.from(domainInfoJson.y / 16).shl(240))
                              .add(BigNumber.from(domainInfoJson.w / 16).shl(232))
                              .add(BigNumber.from(domainInfoJson.h / 16).shl(224))
                              .add(BigNumber.from(domainInfoJson.boxTop).shl(192))
                              .add(BigNumber.from(domainInfoJson.chance1 - 1).shl(176))     // !!!!!!!!!!
                              .add(BigNumber.from(domainInfoJson.chance2).shl(160))
                              .add(BigNumber.from(domainInfoJson.chance3).shl(144))
                              .add(BigNumber.from(domainInfoJson.chance4).shl(128))
                              .add(BigNumber.from(domainInfoJson.ratio1).shl(112))
                              .add(BigNumber.from(domainInfoJson.ratio2).shl(96))
                              .add(BigNumber.from(domainInfoJson.ratio3).shl(80))
                              .add(BigNumber.from(domainInfoJson.ratio4).shl(64))
                              .add(BigNumber.from(domainInfoJson.decimal).shl(56))

    const domainInfo = utils.defaultAbiCoder.encode(['uint256'], [domainInfoBigInt])
    // 0x00140404000a37ab028e028f0a3d0a3d0a3d199a614861490700000000000000
    // 0x00140404000a37ab028e051d0f5a199723d43d6e9eb6ffff0700000000000000
    // 0x00 14 04 04 000a37ab 028e 028f 0a3d 0a3d 0a3d 199a 6148 6149 0700000000000000

    const registerDomainTx = await GreenBTC2S.registerDomain(domainId, domainInfo, {gasPrice: defaultGasPrice})
    await registerDomainTx.wait()

    console.log("GreenBTC2S registerDomain: ", hre.network.name, GreenBTC2SAddress, domainId, domainInfo );

//    console.log('AAAAAAAAA', deployer.address, signer.address)
//    console.log('BBBBBBBBBBB', ethers.utils.id(deployer.address +signer.address))
  }
  if(hre.network.name === 'matic') {
    // 2024/06/13
    const GreenBTC2SAddress  = "0xa777d8855456eac0E3f1C64c148dabaf8e8CcC1F"           // 2024/06/13: Polygon Mainnet
    const GreenBTC2S = StakingRewards__factory.connect(GreenBTC2SAddress, deployer);
  }
};

// 2024/07/05: Call registerDomain (Amoy mainnet): 0xf276AD41bA60e723188496318Ba0E41733C9fF3F
// yarn deploy:matic_test:GreenBTC2SI
// call: registerDomain

func.tags = ["GreenBTC2SI"];

export default func;
