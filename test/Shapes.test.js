const {
  BN,           // Big Number support 
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const { assert } = require("chai");

// helper
const ether = (n) => web3.utils.toWei(n.toString(), 'ether');

// artifacts
const ShapeFactory = artifacts.require("ShapeFactory");

contract("Shapes", accounts => {
  let instance;

  beforeEach(async () => {
    instance = await ShapeFactory.deployed();
  });

  describe("ShapeFactory", () => {

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

  });
});
