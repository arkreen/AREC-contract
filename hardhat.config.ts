//import '@primitivefi/hardhat-dodoc';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import "hardhat-deploy";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-storage-layout";
//import '@nomiclabs/hardhat-waffle'
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import { NetworkUserConfig } from "hardhat/types";

import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

function getAPIKey(network: string): string {
  let apiKey: string
  if((network === 'matic')||(network ==='matic_test')) {
    apiKey = process.env.POLYGONSCAN_API_KEY as string
  } else {
    apiKey = process.env.ETHERSCAN_API_KEY as string
  }
  return apiKey
}

//  url = `https://polygon-mainnet.infura.io/v3/` + projectID
//  url = `https://polygon-mumbai.infura.io/v3/` + projectID
// https://rpc-mumbai.maticvigil.com

function getURL(network:string): string {
  let url: string
  let projectID = process.env.PROJECT_ID
  if(network === 'matic') {
    url = `https://polygon-mainnet.infura.io/v3/` + projectID
  } else if(network === 'matic_test') {
    url = `https://rpc-mumbai.maticvigil.com`
  } else if(network === 'goerli') {
    url = `https://goerli.infura.io/v3/`+ projectID
  } else if(network === 'rinkeby') {
    url = `https://rinkeby.infura.io/v3/`+ projectID    
  } else {
    url = `https://mainnet.infura.io/v3/`+ projectID
  }
  return url
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
    },
    goerli: {
      url: getURL("goerli"),
      accounts: [process.env.ETH_RINKEBY_PRIVATE_KEY as string],
    },     
    rinkeby: {
      url: getURL("rinkeby"),
      accounts: [process.env.ETH_RINKEBY_PRIVATE_KEY as string],
    },    
    matic_test: {
      url: getURL("matic_test"),
      accounts: [process.env.MATIC_TESTNET_PRIVATE_KEY as string, process.env.MATIC_TESTNET_CONFIRM_KEY as string],
    },
    matic: {
      url: getURL("matic"),
      chainId: 137,
      accounts: [process.env.MATIC_PRIVATE_KEY as string],
    },
    BSC_TEST: {
      url: "https://data-seed-prebsc-2-s1.binance.org:8545/",
      accounts: [process.env.BSC_TESTNET_PRIVATE_KEY as string],
    },
    BSC: {
      url: process.env.BSC_MAINNET_RPC,
      accounts: [process.env.BSC_MAINNET_PRIVATE_KEY as string],
    },    
  },
  solidity: {
    compilers: [
      {
        version: "0.8.9",
        settings: {
          metadata: {
            bytecodeHash: "none",
          },
          optimizer: {
            enabled: true,
            runs: 0,
          },
        },
      },
    ],
    settings: {
        outputSelection: {
            "*": {
                "*": ["storageLayout"],
            },
        },
    },
  },
  typechain: {
    outDir: "./typechain",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: {
      matic:        getAPIKey("matic"),
      matic_test:   getAPIKey("matic_test"),
      mainnet:      getAPIKey("mainnet"),
      ropsten:      getAPIKey("ropsten"),
      rinkeby:      getAPIKey("rinkeby"),
      goerli:       getAPIKey("goerli"),
      kovan:        getAPIKey("kovan"),
    },
    customChains: [
      {
        network: "matic",
        chainId: 137,
        urls: {
          apiURL: "https://polygon-rpc.com",
          browserURL: "https://polygonscan.com/"
        }
      },
      {
        network: "matic_test",
        chainId: 80001,
        urls: {
          apiURL: getURL("matic_test"),
          browserURL: "https://mumbai.polygonscan.com/"
        }
      },
    ]
  },  
  namedAccounts: {
    deployer: 0,
    tokenOwner: 1,
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    deploy: "./deploy/script",
    deployments: "./deployments",
  },
};

export default config;