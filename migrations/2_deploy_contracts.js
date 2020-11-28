const ShapeFactory = artifacts.require("ShapeFactory");

module.exports = function(deployer) {
  deployer.deploy(ShapeFactory);
};
