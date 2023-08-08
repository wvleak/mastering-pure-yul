const { expect } = require("chai");

console.log("testing...");

describe("For the Pure Yul Contract", function () {
  let pureYulInstance;

  beforeEach(async function () {
    var abi = require("../build/PureYul.abi.json");
    var bytecode = require("../build/PureYul.bytecode.json");

    const PureYulContract = await hre.ethers.getContractFactory(abi, bytecode);

    pureYulInstance = await PureYulContract.deploy();
    await pureYulInstance.deployed();
  });

  describe("The deployment", function () {
    it("Should deploy correctly", async function () {
      await expect(pureYulInstance.address).is.properAddress;
      await expect(pureYulInstance.address).is.not.null;
    });
  });
});
