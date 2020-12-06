const {
  BN,           // Big Number support 
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const { assert } = require("chai");

const path = require('path');
let fs = require('fs');

// helper
const ether = (n) => web3.utils.toWei(n.toString(), 'ether');

// artifacts
const ShapeFactory = artifacts.require("ShapeFactory");

contract("Shapes", accounts => {
  let instance;
  let shapeData;
  let shapeJson;

  beforeEach(async () => {
    instance = await ShapeFactory.deployed();

    // get the Shape ABI
    shapeData = fs.readFileSync(path.join(__dirname, "../vapp/src/contracts/Shape.json"));
    shapeJson = JSON.parse(shapeData);
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

    it("checks if the owner of SQR&CRC contracts is the ShapeFactory contract", async () => {
      // Factory contract owner
      let factoryOwner = await instance.owner();
      assert.equal(factoryOwner, accounts[0]);
      //console.log("Factory owner: " + factoryOwner);

      // Factory address
      let factoryAddress = await instance.address;
      //console.log("Factory address: " + factoryAddress);

      // fetch the CRC Shape contract
      let addressCRC = await instance.getShapeAddressBySymbol("CRC");
      assert.isTrue(web3.utils.isAddress(addressCRC));
      assert.notEqual(addressCRC, constants.ZERO_ADDRESS);
      let crcInstance = new web3.eth.Contract(shapeJson.abi, addressCRC);

      // check the CRC contract owner
      let crcOwner = await crcInstance.methods.owner().call();
      assert.equal(crcOwner, factoryAddress);
      assert.notEqual(crcOwner, factoryOwner);
      //console.log("CRC owner: " + crcOwner);

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

    it("mints a new SQR token", async () => {
      let addressSQR = await instance.getShapeAddressBySymbol("SQR");
      assert.isTrue(web3.utils.isAddress(addressSQR));
      assert.notEqual(addressSQR, constants.ZERO_ADDRESS); // constants.ZERO_ADDRESS is 0x0000000000000000000000000000000000000000
      
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
        web3.utils.hexToBytes(constants.ZERO_ADDRESS)
      ).send({
        from: accounts[0],
        gas: 300000,
        value: ether(1.2)
      });

      // gas used: 200024
      // console.log("Gas used (mint SQR): " + result.gasUsed);

      // check current balance of the user
      let balanceAfter = await sqrInstance.methods.balanceOf(accounts[0]).call();
      assert.equal(balanceAfter, 1);
    });

    it("fetches the SQR token data (id etc.)", async () => {
      let addressSQR = await instance.getShapeAddressBySymbol("SQR");
      assert.isTrue(web3.utils.isAddress(addressSQR));
      assert.notEqual(addressSQR, constants.ZERO_ADDRESS);
      
      // fetch the Shape contract
      let sqrInstance = new web3.eth.Contract(shapeJson.abi, addressSQR);

      // Get shape name
      let name = await sqrInstance.methods.name().call();
      assert.equal(name, "square");

      // Get shape symbol
      let symbol = await sqrInstance.methods.symbol().call();
      assert.equal(symbol, "SQR");

      // check current SQR balance of the user
      let balance = await sqrInstance.methods.balanceOf(accounts[0]).call();
      assert.equal(balance, 1);

      // get token ID
      let tokenIndex = 0;
      let tokenId = await sqrInstance.methods.tokenOfOwnerByIndex(accounts[0], tokenIndex).call();
      assert.equal(tokenId, 1); // assert token ID is 1

    });

    it("mints two new CRC tokens", async () => {
      let addressCRC = await instance.getShapeAddressBySymbol("CRC");
      assert.isTrue(web3.utils.isAddress(addressCRC));
      assert.notEqual(addressCRC, constants.ZERO_ADDRESS);
      
      // fetch the CRC Shape contract
      let crcInstance = new web3.eth.Contract(shapeJson.abi, addressCRC);

      // sanity check - shape name
      let name = await crcInstance.methods.name().call();
      assert.equal(name, "circle");

      // check current balance of the user
      let balanceBefore = await crcInstance.methods.balanceOf(accounts[0]).call();
      assert.equal(balanceBefore, 0);

      // mint the first CRC token
      let result1 = await crcInstance.methods.mint(
        web3.utils.hexToBytes(constants.ZERO_ADDRESS)
      ).send({
        from: accounts[0],
        gas: 300000,
        value: ether(0.5)
      });

      // gas used: 200,024
      // console.log("Gas used (mint CRC) 1: " + result1.gasUsed);

      // mint the second CRC token
      let result2 = await crcInstance.methods.mint(
        web3.utils.hexToBytes(constants.ZERO_ADDRESS)
      ).send({
        from: accounts[0],
        gas: 300000,
        value: ether(0.5)
      });

      // gas used: 155,024
      // console.log("Gas used (mint CRC) 2: " + result2.gasUsed);

      // check current balance of the user
      let balanceAfter = await crcInstance.methods.balanceOf(accounts[0]).call();
      assert.equal(balanceAfter, 2);
    });

    it("burns a CRC token", async () => {
      let tokenId = 1; // the first CRC token

      // fetch the CRC Shape contract
      let addressCRC = await instance.getShapeAddressBySymbol("CRC");
      assert.isTrue(web3.utils.isAddress(addressCRC));
      assert.notEqual(addressCRC, constants.ZERO_ADDRESS);
      let crcInstance = new web3.eth.Contract(shapeJson.abi, addressCRC);

      // sanity check - token owner
      let tokenOwner = await crcInstance.methods.ownerOf(tokenId).call();
      assert.equal(tokenOwner, accounts[0]);

      // burn the token
      await crcInstance.methods.burn(tokenId).send({
        from: accounts[0],
        gas: 300000
      });

      // check if token still exists
      let exists = await crcInstance.methods.exists(tokenId).call();
      assert.isFalse(exists);
    });

    it("deactivates the CRC shape", async () => {
      // fetch the CRC Shape contract
      let addressCRC = await instance.getShapeAddressBySymbol("CRC");
      assert.isTrue(web3.utils.isAddress(addressCRC));
      assert.notEqual(addressCRC, constants.ZERO_ADDRESS);
      let crcInstance = new web3.eth.Contract(shapeJson.abi, addressCRC);

      // check if the CRC shape is active
      let shapeActive = await crcInstance.methods.isActive().call();
      assert.isTrue(shapeActive);

      let result = await instance.deactivateShape("CRC");
      // Gas used: 22786
      // console.log("Gas used (deactivate shape): " + result.receipt.gasUsed);

      // check if the CRC shape is deactivated now
      shapeActive = await crcInstance.methods.isActive().call();
      assert.isFalse(shapeActive);
    });

    it("re-activates the CRC shape", async () => {
      // fetch the CRC Shape contract
      let addressCRC = await instance.getShapeAddressBySymbol("CRC");
      assert.isTrue(web3.utils.isAddress(addressCRC));
      assert.notEqual(addressCRC, constants.ZERO_ADDRESS);
      let crcInstance = new web3.eth.Contract(shapeJson.abi, addressCRC);

      // check if the CRC shape is inactive
      let shapeActive = await crcInstance.methods.isActive().call();
      assert.isFalse(shapeActive);

      let result = await instance.reactivateShape("CRC");
      // Gas used: 53634
      // console.log("Gas used (reactivate shape): " + result.receipt.gasUsed);

      // check if the CRC shape is reactivated now
      shapeActive = await crcInstance.methods.isActive().call();
      assert.isTrue(shapeActive);
    });

    it("allows the owner to collect ETH from a Shape contract", async () => {
      // get the SQR shape contract address
      let addressSQR = await instance.getShapeAddressBySymbol("SQR");
      assert.isTrue(web3.utils.isAddress(addressSQR));
      assert.notEqual(addressSQR, constants.ZERO_ADDRESS);

      // check contract ETH balance before the collection
      let contractEthBalanceBefore = await web3.eth.getBalance(addressSQR);
      assert.equal(contractEthBalanceBefore, ether(1.2))

      // check the user's ETH balance before the collection
      let userEthBalanceBefore = await web3.eth.getBalance(accounts[0]);

      // collect ETH
      let result = await instance.ownerCollectEtherFromShape("SQR");

      // gas used: 36191
      // console.log("Gas used (ownerCollectEtherFromShape): " + result.receipt.gasUsed);
      
      // get gas price
      const txData = await web3.eth.getTransaction(result.tx);
      const gasPrice = txData.gasPrice;

      // check contract ETH balance after the collection
      let contractEthBalanceAfter = await web3.eth.getBalance(addressSQR);
      assert.equal(contractEthBalanceAfter, 0);

      // check the user's ETH balance after the collection
      let userEthBalanceAfter = await web3.eth.getBalance(accounts[0]);

      let diffEth = ether(1.2)-(result.receipt.gasUsed*gasPrice); // ETH returned minus gas fee
      assert.approximately(Number(userEthBalanceBefore-userEthBalanceAfter), 
                           Number(diffEth), 
                           Number(10000000000000000000)); // error of margin in wei
    });

    xit("fails at minting if value paid is incorrect", async () => {});

    xit("fails to burn a non-existing token (wrong ID)", async () => {});

    xit("fails at trying to create an existing active shape type", async () => {});
    
    xit("fails at deactivating a non-existing shape type", async () => {});

  });
});
