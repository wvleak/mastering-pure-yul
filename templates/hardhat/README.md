# Yul developer experience

## Repository installation

1. Install Dependencies

```
npm install
```

2. Install solidity compiler
   https://docs.soliditylang.org/en/latest/installing-solidity.html#installing-the-solidity-compiler

3. Build Yul contracts

```
node compile/compile.js
```

## Running tests

Run tests

```
npx hardhat run test/PureYul.test.js --no-compile
```

## Deploy

#### Local Deployment

```
npx hardhat run --network localhost scripts/deploy.js
```

#### Network Deployment

As general rule, you can target any network from your Hardhat config using:

```
npx hardhat run --network <your-network> scripts/deploy.js
```
