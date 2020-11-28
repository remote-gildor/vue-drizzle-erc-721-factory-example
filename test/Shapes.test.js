const {
  BN,           // Big Number support 
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const { assert } = require("chai");

let fs = require('fs');

// helper
const ether = (n) => web3.utils.toWei(n.toString(), 'ether');

// artifacts
const ShapeFactory = artifacts.require("ShapeFactory");

contract("Shapes", accounts => {
  let instance;

  beforeEach(async () => {
    instance = await ShapeFactory.deployed();
  });

  describe("ShapeFactory & Shape tests", () => {

    it("creates a new Shape contract (SQR)", async () => {
      let result = await instance.addNewShape("square", "SQR", ether(1.2));

      // gas used: 3,101,990 gas
      // console.log("Gas used: " + result.receipt.gasUsed);
    });

    it("creates another Shape contract (CRC)", async () => {
      /*
      for (let i = 0; i < 80; i++) {
        let result = await instance.addNewShape("circle", "CRC"+i, ether(0.5));

        // gas used: 3,087,002 gas
        // gas used (after 80 shapes created): 3,087,014 gas (basically O(1) complexity)
        // note that the same example with an array (see the other branch) would have O(n) complexity)
        console.log("Gas used: " + result.receipt.gasUsed);
      }
      */

      let result = await instance.addNewShape("circle", "CRC", ether(0.5));
      // gas used: 3,087,002 gas
      // console.log("Gas used: " + result.receipt.gasUsed);
    });

    xit("checks the owner of SQR&CRC contracts is the same as of the ShapeFactory contract", async () => {});

    it("fetches shapeSymbols array length", async () => {
      let length = await instance.getShapeSymbolsArrayLength();
      assert.equal(length, 2);
    });

    it("fetches a shape symbol from the shapeSymbols array using an index", async () => {
      let symbolSQR = await instance.getShapeSymbolByIndex(0);
      assert.equal(symbolSQR, "SQR");

      let symbolCRC = await instance.getShapeSymbolByIndex(1);
      assert.equal(symbolCRC, "CRC");

      await expectRevert(
        instance.getShapeSymbolByIndex(2), // out of bounds
        "invalid opcode"
      )
    });

    it("mints a new SQR token", async () => {
      let addressSQR = await instance.getShapeAddressBySymbol("SQR");
      assert.isTrue(web3.utils.isAddress(addressSQR));
      assert.notEqual(addressSQR, 0x0000000000000000000000000000000000000000);

      // get the Shape ABI
      let data = fs.readFileSync("../vapp/src/contracts/Shape.json");
      let shapeJson = JSON.parse(data);
      
      // fetch the Shape contract
      let sqrInstance = new web3.eth.Contract(shapeJson.abi, addressSQR);

      // sanity check - shape name
      let name = await sqrInstance.methods.name().call();
      assert.equal(name, "square");

      // check current balance of the user
      let balanceBefore = await sqrInstance.methods.balanceOf(accounts[0]).call();
      assert.equal(balanceBefore, 0);

      // mint an SQR token
      let result = await sqrInstance.methods.mint(
        web3.utils.hexToBytes("0x0000000000000000000000000000000000000000")
      ).send({
        from: accounts[0],
        gas: 300000,
        value: ether(1.2)
      });

      // gas used: 178326
      // console.log("Gas used (mint): " + result.gasUsed);

      // check current balance of the user
      let balanceAfter = await sqrInstance.methods.balanceOf(accounts[0]).call();
      assert.equal(balanceAfter, 1);
    });

    xit("fetches the SQR token data (id etc.)", async () => {});

    xit("mints two new CRC tokens", async () => {});

    xit("burns a CRC token", async () => {});

    xit("deactivates the CRC shape", async () => {});

    xit("re-activates the CRC shape", async () => {});

    xit("allows the owner to collect ETH from a Shape contract", async () => {});

    xit("fails at minting if value paid is incorrect", async () => {});

    xit("fails to burn a non-existing token (wrong ID)", async () => {});

    xit("fails at trying to create an existing active shape type", async () => {});
    
    xit("fails at deactivating a non-existing shape type", async () => {});

  });
});
