const hre = require("hardhat");

async function main() {
	var abi = require("../build/PureYul.abi.json");
	var bytecode = require("../build/PureYul.bytecode.json");

	const PureYulContract = await hre.ethers.getContractFactory(abi, bytecode);

	const pureYulInstance = await PureYulContract.deploy();
	await pureYulInstance.deployed();

	console.log(`Pure Yul Contract was deployed to ${pureYulInstance.address}`);
}

main();
