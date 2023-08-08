# Learn pure yul development
Learn how to write, test and deploy pure yul code!

## Description

You might want to code contracts purely in Yul for learning purposes or when having very optimized code is beneficial (e.g. MEV).
Here you will find guidance on how to develop in pure yul with hardhat or foundry. 
## Contents
- [Learn](https://github.com/wvleak/pure-yul-tutorial/edit/main/README.md#learn)
- [Compile](https://github.com/wvleak/pure-yul-tutorial/edit/main/README.md#compile)
- [Test](https://github.com/wvleak/pure-yul-tutorial/edit/main/README.md#test)
- [Deploy](https://github.com/wvleak/pure-yul-tutorial/edit/main/README.md#deploy)
- [Pros and Cons](https://github.com/wvleak/pure-yul-tutorial/edit/main/README.md#learn)

## Learn
### Ressources
Here's a collection of ressources to learn Yul
- Yul - Solidity [documentation](https://docs.soliditylang.org/en/v0.8.21/yul.html)
- Jeffrey Scholz [Udemy course](https://www.udemy.com/course/advanced-solidity-yul-and-assembly/)
- andreitoma8 [learn-yul repo](https://github.com/andreitoma8/learn-yul): notes from Jeffrey Scholz course
- Jesper Kristensen [youtube channel](https://www.youtube.com/watch?v=bdVb_wAdMfg)
- deliriusz [foundry-yul-puzzles repo](https://github.com/deliriusz/foundry-yul-puzzles)
Some of the templates you'll see here are inspired from those ressources. 
### Pure Yul contract structure
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
You can find examples of contracts fully written in Yul in my repo [here](https://github.com/wvleak/yul-token-contracts).
## Compile
To compile Yul, you will need the [solidity compiler](https://docs.soliditylang.org/en/latest/installing-solidity.html) installed

Now you can compile your code with:
```bash
solc --strict-assembly [path to your file] --bin
```
This command will output the binary of your contract in hex

## Test
### Foundry
You will need to deploy the compiled contract via the CREATE instruction
Here's an example: 
```solidity
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
Now you will be able to call the contract in your test via an interface:
```solidity
pragma solidity >=0.8.0;

import "forge-std/Test.sol";
import "./lib/YulDeployer.sol";

interface Example {}

contract ExampleTest is Test {
    YulDeployer yulDeployer = new YulDeployer();

    Example exampleContract;

    function setUp() public {
        exampleContract = Example(yulDeployer.deployContract("Example"));
    }

    function testExample() public {
        bytes memory callDataBytes = abi.encodeWithSignature("randomBytes()");

        (bool success, bytes memory data) = address(exampleContract).call{gas: 100000, value: 0}(callDataBytes);

        assertTrue(success);
        assertEq(data, callDataBytes);
    }
}
```
*Thanks [CodeForcer](https://github.com/CodeForcer/foundry-yul) for the template*

### Hardhat
With hardhat, you will have to build the contract bytecode and create the abi before being able to use it.
You can compile and get the output bytecode in a build folder via this code:
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



fs.writeFile(outputPath, JSON.stringify(bytecode), (err) => {});
```
Contrary to solidity, the contract abi is not created automatically. You will have to write it yourself.
Here's an example:
```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;


contract Test {
    constructor() { b = hex"12345678901234567890123456789012"; }
    event Event(uint indexed a, bytes32 b);
    event Event2(uint indexed a, bytes32 b);
    error InsufficientBalance(uint256 available, uint256 required);
    function foo(uint a) public { emit Event(a, b); }
    bytes32 b;
}
```
would result in the JSON:
```json
[{
"type":"error",
"inputs": [{"name":"available","type":"uint256"},{"name":"required","type":"uint256"}],
"name":"InsufficientBalance"
}, {
"type":"event",
"inputs": [{"name":"a","type":"uint256","indexed":true},{"name":"b","type":"bytes32","indexed":false}],
"name":"Event"
}, {
"type":"event",
"inputs": [{"name":"a","type":"uint256","indexed":true},{"name":"b","type":"bytes32","indexed":false}],
"name":"Event2"
}, {
"type":"function",
"inputs": [{"name":"a","type":"uint256"}],
"name":"foo",
"outputs": []
}]
```
Now that you have the abi and the bytecode in the build folder, you will be able to deploy your contract in the test file as usual:
```javascript
  var abi = require("../build/PureYul.abi.json");
  var bytecode = require("../build/PureYul.bytecode.json");

  const contractInstance = await(await ethers.getContractFactory(abi, bytecode)).deploy();
```
You will just have to add the `--no-compile` when running your test command:
```bash
npx hardhat run test/PureYul.test.js --no-compile
```

*Thanks [Jesper Kristensen](https://www.youtube.com/watch?v=bdVb_wAdMfg) for the template*
## Deploy
### Foundry:
#### Locally
create a script `Deploy.sol` in the scripts folder.
Here's an example:
```solidity
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../test/lib/ERC20YulDeployer.sol";
import "forge-std/console.sol";

interface ERC20Yul {}

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        string memory bashCommand = string.concat(
            'cast abi-encode "f(bytes)" $(solc --strict-assembly yul/',
            string.concat("ERC721Yul", ".yul --bin | grep '^[0-9a-fA-Z]*$')")
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
Start anvil
```bash
anvil
```
Create a .env file with a private key given to you by Anvil.
```.env
PRIVATE_KEY=
```

Then run the following script:
```bash
forge script ./script/Deploy.sol:DeployScript --fork-url http://localhost:8545 --broadcast
```
#### Any network
Update your .env file with your deployment private key.
Then run this command:
```bash
forge script ./script/Deploy.sol:DeployScript --rpc-url [NETWORK_RPC_URL] --broadcast
```
The broadcast transaction logs will be stored in the `broadcast` directory by default. You can change the logs location by setting broadcast in your foundry.toml file. 
### Hardhat:
With Hardhat, you can use this deploy template:
```javascript:
const hre = require("hardhat");

async function main() {
  var abi = require("../build/PureYul.abi.json");
  var bytecode = require("../build/PureYul.bytecode.json");

  const PureYulContract = await ethers.getContractFactory(abi, bytecode);

  const pureYulInstance = await PureYulContract.deploy();
  await pureYulInstance.deployed();

  console.log(`Pure Yul Contract was deployed to ${pureYulInstance.address}`);
}
main();
```
**To deploy it locally:**
```bash
npx hardhat run --network localhost scripts/deploy.js
```
**Any network:**
As general rule, you can target any network from your Hardhat config using:
```bash
npx hardhat run --network <your-network> scripts/deploy.js
```


## Pros and Cons 
Here are some pros and cons of pure Yul development for smart contracts:

**Pros:**

1. **Fine Control** 

2. **Gas Efficiency** 

3. **Memory Management** 

4. **Learning EVM Operations** 

5. **Optimization** 

**Cons:**

1. **Complexity**

2. **Development Speed** 

3. **Limited Abstraction** 

4. **Debugging** 

5. **Lack of Resources** 

In summary, developing smart contracts using pure Yul can offer greater gas efficiency, control, and security, but it comes at the cost of increased complexity, slower development speed, and reduced abstraction. The choice between using Yul and a higher-level language like Solidity depends on your project's requirements, your familiarity with the EVM, and your willingness to invest time in low-level optimizations.

