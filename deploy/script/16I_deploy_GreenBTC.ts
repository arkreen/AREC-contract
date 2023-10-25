import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { GreenBTC__factory } from "../../typechain";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    let GREENBTC_ADDRESS
    let USDC_ADDRESS
    let CART_ADDRESS
    let IMAGE_ADDRESS
    let ART_ADDRESS
    let MANAGER_ADDRESS
    // let USDT_ADDRESS
    // let WMATIC_ADDRESS
    // let AKRE_ADDRESS

    const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(6000000000) : BigNumber.from(50000000000)

    if(hre.network.name === 'matic_test')  {    
      // 2023/10/20, Test Net Simulation 
      //GREENBTC_ADDRESS  = "0x26fa0cc54eC938DB5919b0ABc8353016f3BD81b1"    // 2023/10/20 GreenBTC address
      //GREENBTC_ADDRESS  = "0x8Cc0B065318ACf3Ac761FE5A19Caf68074034006"    // 2023/10/23 GreenBTC address re-deployed
      GREENBTC_ADDRESS  = "0x770cB90378Cb59665BbF623a72b90f427701C825"      // 2023/10/24 GreenBTC address re-deployed as ERC721EnumerableUpgradeable

      // WMATIC_ADDRESS  = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"     // WMATIC address
      // AKRE_ADDRESS    = "0x54e1c534f59343c56549c76d1bdccc8717129832"     // AKRE address
         
      USDC_ADDRESS    = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23"        // USDC address
      CART_ADDRESS    = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"        // CART address
      ART_ADDRESS     = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"        // ART address, use CART_ADDRESS

      //IMAGE_ADDRESS   = "0xC75501B7410Ff630A205245998E0CC9C4f8840ee"      // Image address
      //IMAGE_ADDRESS   = "0x27a30F0B401cC5Cd7bb5477E4fA290CeDFfA8cc7"      // 2023/10/23: Image address
      IMAGE_ADDRESS     = "0xc44ab5E1C00f9df586b80DDbAF00220974a97bC5"      // 2023/10/25: Lucky Image changed
      
      MANAGER_ADDRESS   = "0xBAeF5d8EfA74d3cff297D88c433D7B5d90bf0e49"      // 2023/10/23: Image address

      const [deployer] = await ethers.getSigners();

      const GreenBTCFactory = GreenBTC__factory.connect(GREENBTC_ADDRESS as string, deployer);

/*      
      // 2023/10/20, 2023/10/23, 2023/10/24
      // Approve GreenBTCContract to Tranfer-From the specified tokens
      const approveRouterTx = await GreenBTCFactory.approveBuilder(
                                        [USDC_ADDRESS, ART_ADDRESS] )
      await approveRouterTx.wait()
      console.log("GreenBTCContract approveBuilder is executed: %s: ", hre.network.name, GREENBTC_ADDRESS, 
                                        [USDC_ADDRESS, ART_ADDRESS] );
*/                                        
      // 2023/10/21, 2023/10/23, 2023/10/24, 2023/10/25
      // Set Image Contract address
      const setImageContractTx = await GreenBTCFactory.setImageContract(IMAGE_ADDRESS, {gasPrice: defaultGasPrice})
      await setImageContractTx.wait()
      console.log("GreenBTCContract setImageContract is executed: %s: ", hre.network.name, IMAGE_ADDRESS);
/*
      //  2023/10/23, 2023/10/24
      // Set Manager address
      const setManagerTx = await GreenBTCFactory.setManager(MANAGER_ADDRESS, {gasPrice: defaultGasPrice})
      await setManagerTx.wait()
      console.log("GreenBTCContract setImageContract is executed: %s: ", hre.network.name, MANAGER_ADDRESS);

      //  2023/10/23, 2023/10/24
      // Set mangeARTTokens
      const mangeARTTokensTx = await GreenBTCFactory.mangeARTTokens([ART_ADDRESS], true, {gasPrice: defaultGasPrice})
      await mangeARTTokensTx.wait()
      console.log("GreenBTCContract setImageContract is executed: %s: ", hre.network.name, ART_ADDRESS);
*/      
/*
      // 2023/10/25
      // Set setLuckyRate
      const setLuckyRateTx = await GreenBTCFactory.setLuckyRate(20, {gasPrice: defaultGasPrice})
      await setLuckyRateTx.wait()
      console.log("GreenBTCContract setImageContract is executed: %s: ", hre.network.name, ART_ADDRESS);
*/

    }
    else if(hre.network.name === 'matic')  {        // Matic Mainnet

/*      
      GREENBTC_ADDRESS    = "0xfe9341218c7Fcb6DA1eC131a72f914B7C724F200"        // GreenBTC address

      USDC_ADDRESS      = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"          // USDC address
      USDT_ADDRESS      = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"          // USDT address
      WMATIC_ADDRESS    = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"          // WMATIC address
      AKRE_ADDRESS      = "0x21b101f5d61a66037634f7e1beb5a733d9987d57"          // tAKRE address

      const [deployer] = await ethers.getSigners();
     
      // 2023/04/10
      // Approve HashKeyESGBTCContract to Tranfer-From the specified tokens
      const HashKeyESGBTCFactory = HashKeyESGBTC__factory.connect(ESGBTC_ADDRESS as string, deployer);

      // 2023/04/05
      const approveRouterTx = await HashKeyESGBTCFactory.approveBuilder(
                                        [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] as string[])
      await approveRouterTx.wait()
      console.log("HashKeyESGBTCContract approveBuilder is executed: %s: ", hre.network.name, ESGBTC_ADDRESS, 
                                [USDC_ADDRESS, USDT_ADDRESS, WMATIC_ADDRESS, AKRE_ADDRESS] );                                
*/
    } 
                              
};

// 2023/10/20: call approveBuilder
// yarn deploy:matic_test:GreenBTCI

// 2023/10/21: call setImageContract: manually as method name changed
// yarn deploy:matic_test:GreenBTCI

// 2023/10/23: call approveBuilder and setImageContract
// yarn deploy:matic_test:GreenBTCI

// 2023/10/23: call setManager
// yarn deploy:matic_test:GreenBTCI

// 2023/10/24: call approveBuilder, setImageContract, setManager, mangeARTTokens
// yarn deploy:matic_test:GreenBTCI

// 2023/10/25: call setLuckyRate
// yarn deploy:matic_test:GreenBTCI

// 2023/10/25: call setImageContract
// yarn deploy:matic_test:GreenBTCI

func.tags = ["GreenBTCI"];

export default func;
