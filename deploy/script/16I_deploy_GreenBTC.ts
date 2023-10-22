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
    // let USDT_ADDRESS
    // let WMATIC_ADDRESS
    // let AKRE_ADDRESS

    if(hre.network.name === 'matic_test')  {    
      // 2023/10/20, Test Net Simulation 
      GREENBTC_ADDRESS  = "0x26fa0cc54eC938DB5919b0ABc8353016f3BD81b1"      // 2023/10/20 GreenBTC address

      // WMATIC_ADDRESS  = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"     // WMATIC address
      // AKRE_ADDRESS    = "0x54e1c534f59343c56549c76d1bdccc8717129832"     // AKRE address
         
      USDC_ADDRESS    = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23"        // USDC address
      CART_ADDRESS    = "0x0999afb673944a7b8e1ef8eb0a7c6ffdc0b43e31"        // CART address
      IMAGE_ADDRESS   = "0xC75501B7410Ff630A205245998E0CC9C4f8840ee"        // Image address

      const [deployer] = await ethers.getSigners();

      const GreenBTCFactory = GreenBTC__factory.connect(GREENBTC_ADDRESS as string, deployer);

/*      
      // 2023/10/20
      // Approve GreenBTCContract to Tranfer-From the specified tokens
      const approveRouterTx = await GreenBTCFactory.approveBuilder(
                                        [USDC_ADDRESS, CART_ADDRESS] )
      await approveRouterTx.wait()
      console.log("GreenBTCContract approveBuilder is executed: %s: ", hre.network.name, GREENBTC_ADDRESS, 
                                        [USDC_ADDRESS, CART_ADDRESS] );
*/                                        
      // 2023/10/21
      // Set Image Contract address
      const setImageContractTx = await GreenBTCFactory.setImageContract(IMAGE_ADDRESS, {gasPrice: BigNumber.from(5000000000)})
      await setImageContractTx.wait()
      console.log("GreenBTCContract setImageContract is executed: %s: ", hre.network.name, IMAGE_ADDRESS);

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

func.tags = ["GreenBTCI"];

export default func;
