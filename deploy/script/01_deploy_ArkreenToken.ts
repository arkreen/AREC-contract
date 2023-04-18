import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

// import { expandTo18Decimals } from "../../test/utils/utilities";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    
    // function initialize(uint256 amount, address foundationAddr, string calldata name, string calldata symbol)
    const amount = 10_000_000_000
    const foundationAddr = '0x05D1e64fc523105CECEd7c5Ca70993CD69b8e808'
    const name = 'Arkreen Token'
    const symbol = 'tAKRE'

    const ArkreenToken = await deploy(CONTRACTS.AKRE, {
      from: deployer,
      proxy: {
        proxyContract: "UUPSProxy",
        execute: {
          init: {
            methodName: "initialize",   // Function to call when deployed first time.
            args: [amount, foundationAddr, name, symbol]
          },
        },
      },
      log: true,
      skipIfAlreadyDeployed: false,
    });

    console.log("ArkreenToken deployed to %s: ", hre.network.name, ArkreenToken.address);
    
};

// 2023/04/04: deploy tAKRE
// yarn deploy:matic:ARKE
// Proxy:           0x21B101f5d61A66037634f7e1BeB5a733d9987D57
// Implementation:  0xe47Ee63316855522f4719C36D75964F9B8453A94

func.tags = ["ARKE"];

export default func;
