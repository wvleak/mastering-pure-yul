# Yul developer experience

## Repository installation

1. Install Foundry

```
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Install solidity compiler
   https://docs.soliditylang.org/en/latest/installing-solidity.html#installing-the-solidity-compiler

3. Build Yul contracts and check tests pass

```
forge test
```

## Running tests

Run tests (compiles yul then fetch resulting bytecode in test)

```
forge test
```

To see the console logs during tests

```
forge test -vvv
```

## Deploy

#### Local Deployment

- Lauch Anvil:

```bash
anvil
```

- Generate a `.env` and include a private key provided by Anvil:

```.env
PRIVATE_KEY=
```

- Execute the script locally:

```bash
forge script ./script/Deploy.sol:DeployScript --fork-url http://localhost:8545 --broadcast
```

#### Network Deployment

Update your .env file with your deployment private key, then execute:

```bash
forge script ./script/Deploy.sol:DeployScript --rpc-url [NETWORK_RPC_URL] --broadcast
```
