# Learn pure yul develpment
Learn how to write, test and deploy pure yul code!

## Description

You might want to code in pure yul for learning purposes or when having very optimized code is beneficial (e.g. MEV).
Here's a collection of ressources and a guide to develop in pure yul in hardhat or foundry.
## Contents

## Learn
### Ressources
Here's a collection of ressources to learn Yul
- Yul - Solidity [documentation](https://docs.soliditylang.org/en/v0.8.21/yul.html)
- Jeffrey Scholz [Udemy course](https://www.udemy.com/course/advanced-solidity-yul-and-assembly/)
- andreitoma8 [learn-yul repo](https://github.com/andreitoma8/learn-yul): notes from Jeffrey Scholz course
- Jesper Kristensen [youtube channel](https://www.youtube.com/watch?v=bdVb_wAdMfg)
- deliriusz [foundry-yul-puzzles repo](https://github.com/deliriusz/foundry-yul-puzzles)
Some of the templates you'll see here are inspired from those ressources. Special thanks to Jesper Kristensen for the hardhat template.
### Pure yul contract structure
```yul
object "Example" {
  // Constructor part
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

## Compile
To compile Yul, you will need the [solidity compiler](https://docs.soliditylang.org/en/latest/installing-solidity.html) installed

Now you can compile your code with:
```bash
solc --strict-assembly [path to your file] --bin
```
This will output the binary of your contract in hex

## Test
### Foundry
Template: 
```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/Test.sol";

contract YulDeployer is Test {
    ///@notice Compiles a Yul contract and returns the address that the contract was deployed to
    ///@notice If deployment fails, an error will be thrown
    ///@param fileName - The file name of the Yul contract. For example, the file name for "Example.yul" is "Example"
    ///@return deployedAddress - The address that the contract was deployed to
    function deployContract(string memory fileName) public returns (address) {
        string memory bashCommand = string.concat('cast abi-encode "f(bytes)" $(solc --strict-assembly yul/', string.concat(fileName, ".yul --bin | grep '^[0-9a-fA-Z]*$')"));

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
        return deployedAddress;
    }
}
```
### Hardhat
Compile template:
```javascript
const path = require("path");
const fs = require("fs");
const solc = require("solc");
const { error } = require("console");

const outputPath = path.resolve(__dirname, "..", "build", "ContractName.bytecode.json");

const inputPath = path.resolve(__dirname, "..", "contracts", "ContractName.sol");
const source = fs.readFileSync(inputPath, "utf-8");

var input = {
    language: 'Yul',
    sources: {
        'ContractName.sol' : {
            content: source
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': [ "evm.bytecode" ]
            }
        }
    }
};

const compiledContract = solc.compile(JSON.stringiify(input));
const bytecode = JSON.parse(compiledContract).contracts["ContractName.sol"].PureYul.evm.bytecode.object;
```


fs.writeFile(outputPath, JSON.stringify(bytecode), (err) => {});
```
## Deploy
### Localy
Foundry:
create a script:
```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../test/lib/ERC20YulDeployer.sol";

interface ERC20Yul {}

contract DeployScript is Script {
    ERC20YulDeployer yulDeployer = new ERC20YulDeployer();

    ERC20Yul ERC20YulContract;
    string name = "testToken";
    string symbol = "TST";

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        ERC20YulContract = ERC20Yul(
            yulDeployer.deployContract("ERC20Yul", name, symbol, 18)
        );
        vm.stopBroadcast();
    }
}
```
write env file:
```.env
PRIVATE_KEY=
```
Start anvil
```bash
anvil
```
Update your .env file with a private key given to you by Anvil.

Then run the following script:
```bash
forge script ./script/Deploy.sol:DeployScript --fork-url http://localhost:8545 --broadcast
```




