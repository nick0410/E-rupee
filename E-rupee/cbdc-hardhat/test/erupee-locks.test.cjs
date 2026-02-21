const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("eRupeeToken document-linked locks", function () {
  it("stores CID lock, blocks locked transfers, then releases after unlock time", async function () {
    const [, user, recipient] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("eRupeeToken");
    const token = await Token.deploy(ethers.parseUnits("1000", 18));
    await token.waitForDeployment();

    // Give user funds.
    await (await token.transfer(user.address, ethers.parseUnits("100", 18))).wait();

    const block = await ethers.provider.getBlock("latest");
    const now = block.timestamp;
    const unlockTime = now + 60;
    const lockedAmount = ethers.parseUnits("80", 18);
    const cid = "QmCID123";

    await (
      await token.lockWithDocument(
        user.address,
        lockedAmount,
        unlockTime,
        cid
      )
    ).wait();

    const locks = await token.locksOf(user.address);
    expect(locks.length).to.equal(1);
    expect(locks[0].amount).to.equal(lockedAmount);
    expect(locks[0].unlockTime).to.equal(unlockTime);
    expect(locks[0].documentCID).to.equal(cid);
    expect(await token.lockedBalanceOf(user.address)).to.equal(lockedAmount);

    await expect(
      token.connect(user).transfer(recipient.address, ethers.parseUnits("30", 18))
    ).to.be.revertedWith("transfer exceeds available unlocked balance");

    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);

    await (await token.connect(user).releaseTokens()).wait();

    expect(await token.lockedBalanceOf(user.address)).to.equal(0n);
    const locksAfter = await token.locksOf(user.address);
    expect(locksAfter.length).to.equal(0);

    await expect(
      token.connect(user).transfer(recipient.address, ethers.parseUnits("30", 18))
    ).to.not.be.reverted;
  });
});