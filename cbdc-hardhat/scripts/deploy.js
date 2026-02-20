const hre = require("hardhat");

async function main() {
  const CBDC = await hre.ethers.getContractFactory("CBDC");
  const cbdc = await CBDC.deploy(hre.ethers.utils.parseUnits("1000000", 18));
  await cbdc.deployed();
  console.log("CBDC deployed to:", cbdc.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
