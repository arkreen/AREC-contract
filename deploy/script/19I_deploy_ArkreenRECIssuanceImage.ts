import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { ethers } from "hardhat";
import { ArkreenRECIssuanceImage__factory } from "../../typechain";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await ethers.getSigners();

  const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(100000000000)
  
  if(hre.network.name === 'matic_test') {
    // 2024/04/16
    const arkreenRECIssuanceImageAddress  = "0xD5e8666620eaf809D32c5F2D739C49953FBd6e12"        // Amoy testnet
    const arkreenRECIssuanceImageLogoAddress  = "0x1BdB1555bDc425183ad56FcB31c06205726FEFB0"    // Amoy testnet

    const ArkreenRECIssuanceImageFactory = ArkreenRECIssuanceImage__factory.connect(arkreenRECIssuanceImageAddress, deployer);

    // 2024/04/16, Amoy testnet
    const setImageLogoTx = await ArkreenRECIssuanceImageFactory.setImageLogo(arkreenRECIssuanceImageLogoAddress, {gasPrice: defaultGasPrice})
    await setImageLogoTx.wait()

    console.log("ArkreenRECIssuanceImage setImageLogo Tx:", setImageLogoTx)
    console.log("Set ImageLogo: ", hre.network.name, 
                  arkreenRECIssuanceImageAddress, arkreenRECIssuanceImageLogoAddress);
  }
};

// 2024/04/16: Call setImageLogo (Amoy testnet)
// yarn deploy:matic_test:ArkreenRECIssuanceImageI

func.tags = ["ArkreenRECIssuanceImageI"];

export default func;