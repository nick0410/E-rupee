import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

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
  const address = erup.target ?? erup.address;
  console.log("eRupee deployed to:", address);

  // Auto-write CONTRACT_ADDRESS back into .env so backend picks it up
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  if (envContent.match(/^CONTRACT_ADDRESS=.*/m)) {
    envContent = envContent.replace(/^CONTRACT_ADDRESS=.*/m, `CONTRACT_ADDRESS=${address}`);
  } else {
    envContent += `\nCONTRACT_ADDRESS=${address}\n`;
  }
  fs.writeFileSync(envPath, envContent);
  console.log("✅  CONTRACT_ADDRESS written to .env:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
