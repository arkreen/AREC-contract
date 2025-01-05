import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import { BigNumber } from "ethers";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {

    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    //const defaultGasPrice = (hre.network.name === 'matic_test') ? BigNumber.from(32_000_000_000) : BigNumber.from(50_000_000_000)
    const defaultGasPrice = (hre.network.name === 'dione_test') ? BigNumber.from(250_000_000_000_000) : BigNumber.from(50_000_000_000)

    console.log("Deploying: ", "WrappedToken", deployer);  

    let name = ""   
    let symbol = ""
    let bridge = ""           // dione mainnet

    // function initialize(address kWh, address manager)
    if(hre.network.name === 'dione_test')  {
      // 2025/01/05
      name = "Wrapped Arkreen Token"   
      symbol = "wAKRE"
      //name = "Wrapped Arkreen REC Token"   
      //symbol = "wART"
      bridge = "0x8310f622b6144d909ba6c86d665bf2ad364881a2"           // dione_test
    } else if(hre.network.name === 'dione')  {
      name = "Wrapped Arkreen Token"   
      symbol = "wAKRE"
      // name = "Wrapped Arkreen REC Token"   
      // symbol = "wART"
      bridge = "0xfce056220CDD2AE23b1C986DCaecF6086673AD53"           // dione mainnet
    } else {
      console.log('Wrong Network')
      return
    }

    const wrappedToken = await deploy('WrappedToken', {
        from: deployer,
        args: [name, symbol, bridge],
        log: true,
        skipIfAlreadyDeployed: false,
//      gasPrice: defaultGasPrice
    });
  
    console.log("wrappedToken deployed to %s: ", hre.network.name, wrappedToken.address);
};

// 2025/01/05
// yarn deploy:dione_test:WrapToken         // dione testnet, Wrapped AKRE (Wrong bridge address)
// Implementaion:       0xd83C9743B17426C28Cf3FD12966cc9873D009ABF  

// 2025/01/05
// yarn deploy:dione_test:WrapToken         // dione testnet, Wrapped ART
// Implementaion:       0xd092e1f47d4e5d1C1A3958D7010005e8e9B48206

// 2025/01/05
// yarn deploy:dione:WrapToken              // dione mainnet, Wrapped ART
// Implementaion:       0x953AAc5A0205CCdD6E0b4107ffB0a0ef7155F5bE

// 2025/01/05
// yarn deploy:dione_test:WrapToken         // dione testnet, Wrapped AKRE
// Implementaion:       0xeb0a8d25cc479825e6Ca942D516a1534C32dFBe4

// 2025/01/05
// yarn deploy:dione:WrapToken              // dione mainnet, Wrapped AKRE
// Implementaion:       0x960C67B8526E6328b30Ed2c2fAeA0355BEB62A83


func.tags = ["WrapToken"];

export default func;
