import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";
import { UChildERC20__factory } from "../../typechain";
import { ethers } from "hardhat";
import { utils } from 'ethers'

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const [deployer] = await ethers.getSigners();

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(3_000_000_000) : BigNumber.from(100000000000)

    if(hre.network.name === 'matic_test')  {
      // 2024/04/16: Amoy testnet                        
      const USDTAddress  = "0xc7767ae828E4830e2f800981E573f333d1E492b5"         // Amoy testnet
      const mintAddress  = "0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D"         // Amoy testnet
      const valueUSDT = "100000000000000"

      const USDTFactory = UChildERC20__factory.connect(USDTAddress, deployer);

      const depositData = utils.defaultAbiCoder.encode(['uint256'], [valueUSDT])

      console.log("USDT deposit Tx:", mintAddress, depositData)

      // 2024/04/16, Amoy testnet
      const depositTx = await USDTFactory.deposit(mintAddress, depositData, {gasPrice: defaultGasPrice})
      await depositTx.wait()

      console.log("USDT deposit Tx:", depositTx, mintAddress, depositData)
    }
};

// 2024/04/16
// yarn deploy:matic_test:USDTI    : Amoy testnet (Dev Anv)
// deposit to 0x364a71eE7a1C9EB295a4F4850971a1861E9d3c7D: 100000000 USDT

func.tags = ["USDTI"];

export default func;
