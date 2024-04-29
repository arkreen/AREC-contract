### Build
`yarn`

### Compile Contracts
`yarn compile`

### Run tests with hardhat
`yarn test`
or
`yarn test test\XXXXX.test.ts`
`yarn test {path}\XXXXX.test.ts`

### Verification

- Polygon
npx hardhat --network matic etherscan-verify --api-key XXXXXXXXXX
npx hardhat --network matic etherscan-verify --api-url https://api.polygonscan.com --api-key XXXXXXXXXX

- Polygon Amoy
npx hardhat --network matic_test etherscan-verify --api-url https://api-amoy.polygonscan.com --api-key IA769E8IXXXXXXXXXXX

- Celo 
npx hardhat --network celo etherscan-verify --api-url https://api.celoscan.io --api-key XXXXXXXXXX

- Celo alfajores
npx hardhat --network celo_test etherscan-verify --api-url https://api-alfajores.celoscan.io --api-key XXXXXXXXXX

