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

contract("ShapeFactory", accounts => {
  let instance;

  beforeEach(async () => {
    instance = await ShapeFactory.deployed();
  });

  describe("Shape contract", () => {

    it("creates a new Shape contract (SQR)", async () => {
      let result = await instance.addNewShape("square", "SQR", ether(1.2));

      // gas used (mapping): 3,059,947 gas
      // gas used (array): 3,080,344 gas
      console.log("Gas used: " + result.receipt.gasUsed);
    });

    it("creates another Shape contract (CRC)", async () => {
      let result = await instance.addNewShape("circle", "CRC", ether(0.5));

      // gas used (mapping): 3,059,947 gas
      // gas used (array): 3,074,097 gas
      console.log("Gas used: " + result.receipt.gasUsed);
    });

  });
});
