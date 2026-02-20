const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CBDC", function () {
  it("deploys and mints initial supply to deployer", async function () {
    const [owner] = await ethers.getSigners();
    const CBDC = await ethers.getContractFactory("CBDC");
    const initialSupply = ethers.utils.parseUnits("1000", 18);
    const cbdc = await CBDC.deploy(initialSupply);
    await cbdc.deployed();

    expect(await cbdc.balanceOf(owner.address)).to.equal(initialSupply);
  });
});
