import { ethers } from "ethers";
import fs from "fs";
import path from "path";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
  const defaultPk = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Hardhat local default
  const pk = process.env.PRIVATE_KEY || defaultPk;
  const wallet = new ethers.Wallet(pk, provider);

  const artifactPath = path.resolve(process.cwd(), "artifacts/contracts/eRupeeToken.sol/eRupeeToken.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  const erup = await factory.deploy(ethers.parseUnits("1000000", 18));
  await erup.waitForDeployment();
  console.log("eRupee deployed to:", erup.target ?? erup.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
