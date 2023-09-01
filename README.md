# Mastering Pure Yul Development

Learn the art of crafting, testing, and deploying smart contracts using pure Yul code!

## Overview

Whether you're seeking a comprehensive understanding of Ethereum's inner workings or aiming to harness ultra-optimized code for purposes like MEV, delving into pure Yul development could be your next step. Here, I provide some guidance on honing your pure Yul skills, employing Hardhat and Foundry.

## Contents

- [Learning Path](https://github.com/wvleak/pure-yul-tutorial/tree/main#learning-path)
- [Compilation](https://github.com/wvleak/pure-yul-tutorial/tree/main#compilation)
- [Testing](https://github.com/wvleak/pure-yul-tutorial/tree/main#testing)
- [Deployment](https://github.com/wvleak/pure-yul-tutorial/tree/main#deployment)
- [Pros and Cons](https://github.com/wvleak/pure-yul-tutorial/tree/main#pros-and-cons)

## Learning Path

### Resources

Explore these resources to master Yul:

- Yul - Solidity [documentation](https://docs.soliditylang.org/en/v0.8.21/yul.html)
- Jeffrey Scholz's [Udemy course](https://www.udemy.com/course/advanced-solidity-yul-and-assembly/)
- andreitoma8's [learn-yul repository](https://github.com/andreitoma8/learn-yul): Notes from Jeffrey Scholz's course
- Jesper Kristensen's [YouTube channel](https://www.youtube.com/watch?v=bdVb_wAdMfg)
- deliriusz's [foundry-yul-puzzles repository](https://github.com/deliriusz/foundry-yul-puzzles)

Templates within this tutorial draw inspiration from these resources.

### Pure Yul Contract Structure

```yul
object "Example" {
  // Constructor
  code {
    datacopy(0, dataoffset("Runtime"), datasize("Runtime"))
    return(0, datasize("Runtime"))
  }
  //Actual code
  object "Runtime" {
    // Return the calldata
    code {
      mstore(0x80, calldataload(0))
      return(0x80, calldatasize())
    }
  }
}
```

For fully Yul-written contract examples, refer to my repository [here](https://github.com/wvleak/yul-token-contracts).

## Compilation

To compile Yul, you'll need the [Solidity compiler](https://docs.soliditylang.org/en/latest/installing-solidity.html) installed. Compile your code using:

```bash
solc --strict-assembly [FILE_PATH] --bin
```

This command outputs the hexadecimal binary representation of your contract.

## Testing

### Using Foundry

To use your compiled contract in a test, you'll need to deploy it. In Foundry, you can do so by using the inline assembly CREATE instruction. Refer to this example:

```solidity
pragma solidity 0.8.15;

import "forge-std/Test.sol";

contract YulDeployer is Test {
    /**
     * @notice Deploys a Yul contract and returns the address where the contract was deployed
     * @param fileName - The file name of the Yul contract (e.g., "Example.yul" becomes "Example")
     * @return deployedAddress - The address where the contract was deployed
     */
    function deployContract(string memory fileName) public returns (address) {
        string memory bashCommand = string.concat(
            'cast abi-encode "f(bytes)" $(solc --strict-assembly yul/',
            string.concat(fileName, ".yul --bin | grep '^[0-9a-fA-Z]*$')")
        );

        string[] memory inputs = new string[](3);
        inputs[0] = "bash";
        inputs[1] = "-c";
        inputs[2] = bashCommand;

        bytes memory bytecode = abi.decode(vm.ffi(inputs), (bytes));

        address deployedAddress;
        assembly {
            deployedAddress := create(0, add(bytecode, 0x20), mload(bytecode))
        }

        require(
            deployedAddress != address(0),
            "YulDeployer could not deploy contract"
        );

        return deployedAddress;
    }
}
```

With this deployment logic in place, you can now interact with the contract. <br>
Set up your test like so:

```solidity
interface Example {}

contract ExampleTest is Test {
    YulDeployer yulDeployer = new YulDeployer();

    Example exampleContract;

    function setUp() public {
        exampleContract = Example(yulDeployer.deployContract("Example"));
    }
      ...
}
```
You can now launch your test with:
```bash
forge test -vvv
```
*Make sure you have the ffi allowed before running your tests. Add: `ffi = true` in foundry.toml file.*

_Special thanks to [CodeForcer](https://github.com/CodeForcer/foundry-yul) for providing this template._

### Using Hardhat

To utilize Hardhat effectively, you must generate the contract bytecode and create the ABI before you can employ the contract. This script compiles and obtains the bytecode's output within a designated build folder:

```javascript
const path = require("path");
const fs = require("fs");
const solc = require("solc");

const outputPath = path.resolve(
  __dirname,
  "..",
  "build",
  "ContractName.bytecode.json"
);
const inputPath = path.resolve(
  __dirname,
  "..",
  "contracts",
  "ContractName.sol"
);
const source = fs.readFileSync(inputPath, "utf-8");

const input = {
  language: "Yul",
  sources: {
    "ContractName.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["evm.bytecode"],
      },
    },
  },
};

const compiledContract = solc.compile(JSON.stringify(input));
const bytecode =
  JSON.parse(compiledContract).contracts["ContractName.sol"].PureYul.evm
    .bytecode.object;

fs.writeFileSync(outputPath, JSON.stringify(bytecode));
```

In contrast to Solidity, the contract ABI is not generated automatically; it requires manual creation.
Here are the [specifications](https://docs.soliditylang.org/en/v0.8.21/abi-spec.html#json) of an ABI.

With the ABI and bytecode saved in the build folder, you can now deploy your contract within a test file as follows:

```javascript
const abi = require("../build/PureYul.abi.json");
const bytecode = require("../build/PureYul.bytecode.json");

const contractInstance = await (
  await ethers.getContractFactory(abi, bytecode)
).deploy();
```

For your test command, as the contract is already built, to avoid any error, remember to add `--no-compile` when executing:

```bash
npx hardhat run test/PureYul.test.js --no-compile
```

_Credits to [Jesper Kristensen](https://www.youtube.com/watch?v=bdVb_wAdMfg) for the template._

## Deployment

### Foundry

When deploying contracts with Foundry, you can follow these steps:

#### Local Deployment

- Create a script `Deploy.sol` in the scripts folder.
  _Example:_

```solidity
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";


contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        string memory bashCommand = string.concat(
            'cast abi-encode "f(bytes)" $(solc --strict-assembly yul/',
            string.concat("YourContract", ".yul --bin | grep '^[0-9a-fA-Z]*$')")
        );

        string[] memory inputs = new string[](3);
        inputs[0] = "bash";
        inputs[1] = "-c";
        inputs[2] = bashCommand;

        bytes memory bytecode = abi.decode(vm.ffi(inputs), (bytes));

        ///@notice deploy the bytecode with the create instruction
        address deployedAddress;
        assembly {
            deployedAddress := create(0, add(bytecode, 0x20), mload(bytecode))
        }

        ///@notice check that the deployment was successful
        require(
            deployedAddress != address(0),
            "YulDeployer could not deploy contract"
        );
        ///@notice return the address that the contract was deployed to
        vm.stopBroadcast();

        console.log("Contract address:");
        console.log(address(deployedAddress));
    }
}
```

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
You will get the output of your transaction in the broadcast folder. 

### Hardhat

Use a deploy script similar to:

```javascript
const hre = require("hardhat");

async function main() {
  // ABI and bytecode import...

  const PureYulContract = await ethers.getContractFactory(abi, bytecode);

  const pureYulInstance = await PureYulContract.deploy();
  await pureYulInstance.deployed();

  console.log(`Pure Yul Contract was deployed to ${pureYulInstance.address}`);
}
main();
```
#### Local Deployment
For local deployment:

```bash
npx hardhat run --network localhost scripts/deploy.js
```
#### Network Deployment
As general rule, you can target any network from your Hardhat config using:

```bash
npx hardhat run --network <your-network> scripts/deploy.js
```

## Pros and Cons

Now you know how to compile, test and deploy pure Yul contract! 
Let's dig into the pros and cons of using pure Yul for smart contract development:

**Advantages:**

1. **Precision Control**: Achieve meticulous control over contract behavior and optimize for gas efficiency.
2. **Gas Efficiency**: Craft contracts that consume less gas, optimizing transaction costs.
3. **Memory Management**: Lower-level management reduces vulnerabilities tied to memory allocation or reentrancy attacks.
4. **Learning Experience**: Gain in-depth insights into EVM operations, memory management, and execution flow.
5. **Optimization**

**Disadvantages:**

1. **Complexity**: Yul's low-level nature demands deep understanding of EVM mechanics, leading to potentially error-prone development.
2. **Development Time**: Building in Yul can be time-intensive due to intricate manual management of low-level details.
3. **Abstraction Limitations**: Yul lacks high-level abstractions, leading to longer development cycles and complex maintenance.
4. **Debugging Challenges**: Debugging Yul code can be harder due to limited tooling and intricate low-level operations.
5. **Limited Resources**: Solidity enjoys a larger community and resources, making Yul a less supported choice. Moreover, your Yul contracts cannont be verified on etherscan.

In conclusion, pure Yul development offers gas efficiency and control, but comes with complexity and potential delays. The decision between Yul and higher-level languages depends on your project's needs, your EVM expertise, and your willingness to optimize at the bytecode level.
