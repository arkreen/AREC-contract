import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { GreenBTC__factory } from "../../typechain";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

  const { getChainId } = hre;

  const chainID = await getChainId()
  const defaultGasPrice = (chainID === '80002') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)

  if(hre.network.name === 'matic_test') {
    // const GREENBTC_PROXY_ADDRESS  = "0x770cB90378Cb59665BbF623a72b90f427701C825"     // 2023/10/24: Green BTC proxy
    // const NEW_IMPLEMENTATION = "0x17533f8C83eaFbacE7443647Ec9C2326190955Fb"       // 2023/10/24: Upgrade URI logic with open/reveal
    // const NEW_IMPLEMENTATION = "0x7dbCb85512a9889287b3fD61EDab1fA615D654b8"       // 2023/10/24: Upgrade for luckyRate updateable
    // const NEW_IMPLEMENTATION = "0x1DBB6623A6cF8b12bd1FB4A138D7FE11b1ec5f2e"       // 2023/10/25: Upgrade for luckyRate
    // const NEW_IMPLEMENTATION = "0x71CfBEAC18B738C5Cc34515C0316495A6CDf7231"       // 2023/10/25: Upgrade for changong management strategy
    // const NEW_IMPLEMENTATION = "0xc2f3A5b34D7Ed23297C57597001d82904191454D"       // 2023/10/26: Upgrade to change beneficiary to minter, greenType is used to flag ART type
    // const NEW_IMPLEMENTATION = "0x9a1FC5338303b7E675a9cFfA2050aa7300760b5F"       // 2023/10/26: Add ART type check, and check minter is not zero
    // const NEW_IMPLEMENTATION = "0x1fcF387670f4f4835029eCE4acAb5CF327BFc005"       // 2023/10/27: Change image contract, move  all svg logic to image contract
    // const NEW_IMPLEMENTATION = "0xf2F563a63ba82aF85294d8d857dF7e7A22DdaB8B"       // 2023/12/04: Add buying in batch, and buy with opening 
    // const NEW_IMPLEMENTATION = "0x5Ae000aee2BFA8CB76f655FdBCdFe3Cb0e727941"       // 2023/12/05: Upgrade for enable pay back config
    // const NEW_IMPLEMENTATION = "0x331DA2A2E7a92247AFe4A7f96F1bbc7099933527"       // 2024/01/27: Upgrade to support: Charge offset ART, one badge for batch buying
    // const NEW_IMPLEMENTATION = "0xcFb70419C26A66dBBF5496987b6a207Bfa4a31A9"       // 2024/01/30: Upgrade to skip occupied blocks in batch mode
    // const NEW_IMPLEMENTATION    = "0xa806AC934936562a21f568D94610E54E47bb237a"    // 2024/02/02: Upgrade to swap the event position of OpenBox and GreenBitCoin

    const GREENBTC_PROXY_ADDRESS  = "0x2Bb79dB8b6149F7499CA1bA7eeBE9E736be4dBA9"     // 2024/04/28: Green BTC on Amoy testnet
    // const NEW_IMPLEMENTATION   = "0x0a9E5889f0bd049583093a31E375Fd15427F8773"     // 2024/04/28: Original
    // const NEW_IMPLEMENTATION   = "0x160c413f125550c89C7D21FA1C8567986411504E"     // 2024/04/28: Upgrade to change the control of setNewCaps from manager to owner
    // const NEW_IMPLEMENTATION   = "0x0635aE3d966FaA129cd0eafc5996bE9a4aB16eD2"     // 2024/04/28: Upgrade on Amoy testnet to support ART subsidy
    //  const NEW_IMPLEMENTATION  = "0x6Cb3798C723594cB56BC0a0320BBaBd83756E4FB"     // 2024/05/09: Upgrade on Amoy testnet to support using cART whie no subsidy, using ART with subsidy
    const NEW_IMPLEMENTATION      = "0x68471882c661BB1A8E8AB32fc1A6bb1A16569fE3"     // 2024/07/08: Upgrade on Amoy testnet: ratioSubsidyCap is allowed to be 99 at maximum.

    console.log("Updating GreenBTC: ", GREENBTC_PROXY_ADDRESS, chainID, defaultGasPrice.toString());  

    const [deployer] = await ethers.getSigners();
    const GreenBTCFactory = GreenBTC__factory.connect(GREENBTC_PROXY_ADDRESS, deployer);
    const updateTx = await GreenBTCFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("GreenBTC: ", hre.network.name, GreenBTCFactory.address, NEW_IMPLEMENTATION);

    /*
    // 2024/05/09: Upgrade on Amoy testnet to support using cART whie no subsidy, using ART with subsidy
    const ART_TOKEN      = "0x615835Cc22064a17df5A3E8AE22F58e67bCcB778"     
    const setARTContractTx = await GreenBTCFactory.setARTContract(ART_TOKEN, {gasPrice: defaultGasPrice})
    await setARTContractTx.wait()
    console.log("GreenBTCContract setARTContract is executed: %s: ", hre.network.name, ART_TOKEN);
    */

  } 

  if(hre.network.name === 'matic') {
    const GREENBTC_PROXY_ADDRESS  = "0xDf51F3DCD849f116948A5B23760B1ca0B5425BdE"    // 2023/10/27: Green BTC proxy on Polygon Mainnet
    // const NEW_IMPLEMENTATION   = "0x85304b15f0762c0b2752C60e29D04843b17D79c7"    // 2024/10/27: Original implementation
    // const NEW_IMPLEMENTATION   = "0xAC591f8caf3a100b14D4AdD264AB2eE086E5fB09"    // 2024/02/03: Upgrade to the latest verstion: Charge offset ART and skip occupied blocks in batch mode
    // const NEW_IMPLEMENTATION   = "0xB05EDA9785B7C44Ac5dF78c21c577148cDb865d7"    // 2024/03/06: Upgrade to handle OpenList overtimed
    // const NEW_IMPLEMENTATION   = "0x859343C2b08fAbAba27A0887852bda7e5724cF6B"    // 2024/03/06A: Upgrade to optimize the gas usage of revealBoxes
    // const NEW_IMPLEMENTATION   = "0xBC66D05918F79ea139254E662441eCf528360348"    // 2024/03/06B: Upgrade to optimize the gas usage of deleting big array in storage
    // const NEW_IMPLEMENTATION   = "0xa4F20c70668ACee2648908c94884d7A8A2A726c6"    // 2024/03/07: Upgrade to restore the restore OvertimeBox list
    // const NEW_IMPLEMENTATION   = "0xbe02b9b4Eb01d81493f4fb211E0D1F90D0CE37b4"    // 2024/03/08: Upgrade to restore the restore OvertimeBox list by updating
    // const NEW_IMPLEMENTATION   = "0x81eaB74123513E30Da96aDf4B41b5Ba51d9E650E"    // 2024/03/10: Upgrade to support revealcap: overtimeRevealCap, normalRevealCap, removeRevealCap
    // const NEW_IMPLEMENTATION   = "0x29819D75AeEe53402AB069DEB3B13AF9F8Db9FAf"    // 2024/04/30: Upgrade to support ART subsidy
    // const NEW_IMPLEMENTATION   = "0xf9e8B934db91A80009e24d3CA0Bf3273CDfA079c"    // 2024/05/09: Upgrade on Polygon mainnet to support using cART whie no subsidy, using ART with subsidy
    const NEW_IMPLEMENTATION      = "0x12c44FF98a175401202569b6B2D0457997ceA8Cd"    // 2024/07/07: Upgrade on Polygon mainnet: ratioSubsidyCap is allowed to be 99 at maximum.

    console.log("Updating GreenBTC: ", GREENBTC_PROXY_ADDRESS, chainID, defaultGasPrice.toString());  

    const [deployer] = await ethers.getSigners();
    const GreenBTCFactory = GreenBTC__factory.connect(GREENBTC_PROXY_ADDRESS, deployer);
    const updateTx = await GreenBTCFactory.upgradeTo(NEW_IMPLEMENTATION, {gasPrice: defaultGasPrice})
    await updateTx.wait()

    console.log("Update Trx:", updateTx)
    console.log("GreenBTC: ", hre.network.name, GreenBTCFactory.address, NEW_IMPLEMENTATION);

/*    
    // 2024/05/09: Upgrade on Polygon testnet to support using cART whie no subsidy, using ART with subsidy
    const ART_TOKEN      = "0x58E4D14ccddD1E993e6368A8c5EAa290C95caFDF"     
    const setARTContractTx = await GreenBTCFactory.setARTContract(ART_TOKEN, {gasPrice: defaultGasPrice})
    await setARTContractTx.wait()
    console.log("GreenBTCContract setARTContract is executed: %s: ", hre.network.name, ART_TOKEN);
*/

/*
    // 2024/05/06: Update Image contract
    const IMAGE_ADDRESS  = "0x66e4509f99E7b47f4c7329c7E1f35483aA7c3D34"         // 2024/05/06(Polygon): Upgrade to support ART disaccount
    const setImageContractTx = await GreenBTCFactory.setImageContract(IMAGE_ADDRESS, {gasPrice: defaultGasPrice})
    await setImageContractTx.wait()
    console.log("GreenBTCContract setImageContract is executed: %s: ", hre.network.name, IMAGE_ADDRESS);
*/

/*    
    // 2024/04/30
    // setGreenBTCPro
    const  GreenBTCPro_Address = "0x0Ab06c2f66A4982EdC0D9112C4F896d87E3b99A1"
    const setGreenBTCProTx = await GreenBTCFactory.setGreenBTCPro(GreenBTCPro_Address, {gasPrice: defaultGasPrice})
    await setGreenBTCProTx.wait()
    console.log("GreenBTCContract setNewCaps is executed: %s: ", hre.network.name);

    // 2024/04/30
    // setRatioSubsidyCap
    const setRatioSubsidyCapTx = await GreenBTCFactory.setRatioSubsidyCap(90, {gasPrice: defaultGasPrice})
    await setRatioSubsidyCapTx.wait()
    console.log("GreenBTCContract setRatioSubsidyCap is executed: %s: ", hre.network.name);
*/

  } 

};

// 2023/10/24: Upgrade to change open/reavel logic: 0x17533f8C83eaFbacE7443647Ec9C2326190955Fb
// yarn deploy:matic_test:GreenBTCU

// 2023/10/25: Upgrade to update luckyRate: 0x1DBB6623A6cF8b12bd1FB4A138D7FE11b1ec5f2e
// yarn deploy:matic_test:GreenBTCU

// 2023/10/25: Upgrade to update luckyRate: 0x71CfBEAC18B738C5Cc34515C0316495A6CDf7231
// yarn deploy:matic_test:GreenBTCU

// 2023/10/26: Upgrade to change beneficiary to minter, greenType is used to flag ART type
// yarn deploy:matic_test:GreenBTCU

// 2023/10/26:1: Add ART type check, and check minter is not zero
// yarn deploy:matic_test:GreenBTCU

// 2023/10/27: Change image contract, move  all svg logic to image contract
// yarn deploy:matic_test:GreenBTCU

// 2023/12/04: Add buying in batch, and buy with opening
// yarn deploy:matic_test:GreenBTCU

// 2023/12/05: Upgrade to enable payback config
// yarn deploy:matic_test:GreenBTCU : 0x5Ae000aee2BFA8CB76f655FdBCdFe3Cb0e727941

// 2024/01/27: Upgrade to support: Charge offset ART, one badge for batch buying
// yarn deploy:matic_test:GreenBTCU : 0x331DA2A2E7a92247AFe4A7f96F1bbc7099933527

// 2024/01/30: Upgrade to skip occupied blocks in batch mode
// yarn deploy:matic_test:GreenBTCU : 0xcFb70419C26A66dBBF5496987b6a207Bfa4a31A9

// 2024/02/02: Upgrade to swap the event position of OpenBox and GreenBitCoin
// yarn deploy:matic_test:GreenBTCU : 0xa806AC934936562a21f568D94610E54E47bb237a

// 2024/02/03: Polygon Mainnet: Upgrade to the latest verstion: Charge offset ART and skip occupied blocks in batch mode
// yarn deploy:matic:GreenBTCU : 0xAC591f8caf3a100b14D4AdD264AB2eE086E5fB09

// 2024/03/06: Polygon Mainnet: Upgrade to handle OpenList overtimed
// yarn deploy:matic:GreenBTCU : 0xB05EDA9785B7C44Ac5dF78c21c577148cDb865d7

// 2024/03/06A: Polygon Mainnet: Upgrade to optimize the gas usage of revealBoxes
// yarn deploy:matic:GreenBTCU : 0x859343C2b08fAbAba27A0887852bda7e5724cF6B

// 2024/03/06B: Polygon Mainnet: Upgrade to optimize the gas usage of deleting big array in storage 
// yarn deploy:matic:GreenBTCU : 0xBC66D05918F79ea139254E662441eCf528360348

// 2024/03/07: Polygon Mainnet: Upgrade to restore the restore OvertimeBox list
// yarn deploy:matic:GreenBTCU : 0xa4F20c70668ACee2648908c94884d7A8A2A726c6

// 2024/03/08: Polygon Mainnet: Upgrade to restore the restore OvertimeBox list by updating
// yarn deploy:matic:GreenBTCU : 0xbe02b9b4Eb01d81493f4fb211E0D1F90D0CE37b4

// 2024/03/10: Polygon Mainnet: Upgrade to support revealcap: overtimeRevealCap, normalRevealCap, removeRevealCap
// yarn deploy:matic:GreenBTCU : 0x81eaB74123513E30Da96aDf4B41b5Ba51d9E650E

// 2024/04/28: Upgrade to change the control of setNewCaps from manager to owner
// yarn deploy:matic_test:GreenBTCU : 0x160c413f125550c89C7D21FA1C8567986411504E

// 2024/04/28A: Restore back 
// yarn deploy:matic_test:GreenBTCU : 0x0a9E5889f0bd049583093a31E375Fd15427F8773

// 2024/04/28B: Upgrade on Amoy testnet to support ART subsidy
// yarn deploy:matic_test:GreenBTCU : 0x0635aE3d966FaA129cd0eafc5996bE9a4aB16eD2

// 2024/04/30: Upgrade on Polygon mainnet to support ART subsidy
// yarn deploy:matic:GreenBTCU : 0x29819D75AeEe53402AB069DEB3B13AF9F8Db9FAf

// 2024/05/06: Revert on Polygon mainnet to previous version: Token URI error
// yarn deploy:matic:GreenBTCU : 0x81eaB74123513E30Da96aDf4B41b5Ba51d9E650E

// 2024/05/06A: Restore on Polygon mainnet to the latest version and update Imgae contract
// yarn deploy:matic:GreenBTCU : 0x29819D75AeEe53402AB069DEB3B13AF9F8Db9FAf

// 2024/05/09: Upgrade on Amoy testnet to support using cART whie no subsidy, using ART with subsidy
// And set ART token address
// yarn deploy:matic_test:GreenBTCU : 0x6Cb3798C723594cB56BC0a0320BBaBd83756E4FB

// 2024/05/09A: Upgrade on polygon mainet to support using cART whie no subsidy, using ART with subsidy
// And set ART token address
// yarn deploy:matic:GreenBTCU : 0xf9e8B934db91A80009e24d3CA0Bf3273CDfA079c

// 2024/07/07: Upgrade on Polygon mainnet: ratioSubsidyCap is allowed to be 99 at maximum.
// yarn deploy:matic:GreenBTCU : 0x12c44FF98a175401202569b6B2D0457997ceA8Cd

// 2024/07/08: Upgrade on Amoy testnet: ratioSubsidyCap is allowed to be 99 at maximum.
// yarn deploy:matic_test:GreenBTCU : 0x68471882c661BB1A8E8AB32fc1A6bb1A16569fE3

export default func;
func.tags = ["GreenBTCU"];