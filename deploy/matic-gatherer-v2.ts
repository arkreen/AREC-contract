import fetch from 'node-fetch';

const getAddress = () => {
  const address = process.argv[2];
  if (!address) {
    console.log(`Please add the address as script argument`);
    process.exit(1);
  }
  return address;
};

const getMatic = async (address: string) => {
  console.log(`fetching matic to ${address}`);
  fetch(`https://api.faucet.matic.network/transferTokens`, {
      method: 'POST',
      body: JSON.stringify({
        network: 'mumbai',
        address: address,
        token: 'MATIC',                 //
      }),
      headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json()).then(console.log)

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  // const delay = async (ms) => setTimeout(resolve, ms);
  console.log(`waiting 2 minutes`);
  await delay(2 * 60000);
};

async function main() {
  // const address = getAddress();
  const address = '0x407552d30C85E540EFc83DE7Cd21A9Df5e3d201D';
  getMatic(address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
