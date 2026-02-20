import { create } from "ipfs-http-client";
import fs from "fs";

const IPFS_API_URL = process.env.IPFS_API_URL || "https://ipfs.infura.io:5001/api/v0";

export async function uploadFileToIPFS(input) {
  const client = create({ url: IPFS_API_URL });

  let content;
  if (Buffer.isBuffer(input)) {
    content = input;
  } else if (typeof input === "string") {
    content = fs.readFileSync(input);
  } else {
    throw new Error("Unsupported upload input");
  }

  const added = await client.add(content);
  return added.cid.toString();
}
