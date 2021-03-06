// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract ShapeFactory is Ownable {
  mapping (string => Shape) shapes; // mapping: symbol to shape pointer
  string[] shapeSymbols; // an array of shape symbols

  function addNewShape(string memory _name, string memory _symbol, uint _price) public onlyOwner {
    // check if shape address is not null
    if (address(shapes[_symbol]) != address(0)) {
      // if not null, check if shape is active
      if (shapes[_symbol].isActive()) {
        revert("A ShapeType with this symbol already exists.");
      } else {
        // reactivate the shape
        shapes[_symbol].reactivate();
        return;
      }
    }

    // if shape address in mapping is null, the shape doesn't exist yet, so create a new one
    Shape shape = new Shape(_name, _symbol, _price);
    shapes[_symbol] = shape;
    shapeSymbols.push(_symbol);
  }

  function deactivateShape(string memory _symbol) public onlyOwner {
    if (address(shapes[_symbol]) != address(0)) {
      // if not null, check if shape is active
      if (shapes[_symbol].isActive()) {
        // deactivate the shape
        shapes[_symbol].deactivate();
        return;
      } else {
        revert("The Shape is already inactive.");
      }
    } else {
      revert("A Shape with this symbol does not exist.");
    }
  }

  function getShapeSymbolsArrayLength() public view returns (uint256) {
    return shapeSymbols.length;
  }

  function getShapeSymbolByIndex(uint _index) public view returns (string memory) {
    return shapeSymbols[_index];
  }

  function getShapeAddressBySymbol(string memory _symbol) public view returns (address) {
    return address(shapes[_symbol]);
  }

  function ownerCollectEtherFromShape(string memory _symbol) public onlyOwner {
    // ETH can be collected from only one Shape contract at a time
    shapes[_symbol].ownerCollectEther(msg.sender);
  }

  function reactivateShape(string memory _symbol) public onlyOwner {
    if (address(shapes[_symbol]) != address(0)) {
      // if not null, check if shape is active
      if (!shapes[_symbol].isActive()) {
        // reactivate the shape
        shapes[_symbol].reactivate();
        return;
      } else {
        revert("The Shape is already active.");
      }
    }
  }
}

contract Shape is ERC721, ERC721Burnable, Ownable {

  // contract variables
  uint supply = 0;
  uint priceWei = 0;
  bool active = true;
  uint lastId = 0;

  // events
  event TokenMinted(address indexed _from, string indexed _symbol);
  event TokenBurned(address indexed _from, bytes32 indexed _symbol);
  event ShapeTypeAdded(address indexed _from, bytes32 indexed _symbol);
  event ShapeTypeDeactivated(address indexed _from, bytes32 indexed _symbol);
  event EtherCollected(address indexed _from, uint indexed _balance);

  // constructor
  constructor(string memory _name, string memory _symbol, uint _priceWei) 
  ERC721(_name, _symbol) {
    priceWei = _priceWei;
  }

  // methods
  function deactivate() public onlyOwner {
    active = false;
  }

  function exists(uint256 tokenId) public view returns (bool) {
    return super._exists(tokenId);
  }

  function isActive() public view returns (bool) {
    return active;
  }

  function mint(bytes memory _data) public payable {
    // check if shape is active
    require(active == true, "Shape is deactivated");

    // check if the amount paid is correct
    require(msg.value == priceWei, "Wrong amount of ETH sent.");

    lastId += 1;

    // mint the ERC-721 token
    super._safeMint(msg.sender, lastId, _data);

    emit TokenMinted(msg.sender, super.symbol());
  }

  function ownerCollectEther(address receiver) public onlyOwner {
    uint balance = address(this).balance;

    (bool success, ) = receiver.call{value: balance}("");

    if (!success)
      revert("Collecting ETH was not successful.");

    emit EtherCollected(receiver, balance);
  }

  function reactivate() public onlyOwner {
    if (active == false) {
      active = true;
    }
  }

}
