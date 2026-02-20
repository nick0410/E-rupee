// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract eRupeeToken is ERC20, Ownable {
    mapping(address => uint256) private _locked;

    struct LockEntry {
        uint256 amount;
        uint256 unlockTime;
        string documentCID;
    }

    mapping(address => LockEntry[]) private _locks;

    constructor(uint256 initialSupply) ERC20("eRupee", "eINR") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function lockTokens(address user, uint256 amount, uint256 unlockTime) external onlyOwner {
        _createLock(user, amount, unlockTime, "");
    }

    function lockWithDocument(address user, uint256 amount, uint256 unlockTime, string calldata documentCID) external onlyOwner {
        _createLock(user, amount, unlockTime, documentCID);
    }

    function releaseTokens() external {
        _releaseExpiredLocks(msg.sender);
    }

    function releaseExpiredLocks(address user) external {
        _releaseExpiredLocks(user);
    }

    function lockedBalanceOf(address user) external view returns (uint256) {
        return _locked[user];
    }

    function locksOf(address user) external view returns (LockEntry[] memory) {
        return _locks[user];
    }

    function availableBalanceOf(address user) external view returns (uint256) {
        uint256 bal = balanceOf(user);
        uint256 locked = _locked[user];
        if (bal > locked) return bal - locked;
        return 0;
    }

    function _createLock(address user, uint256 amount, uint256 unlockTime, string memory documentCID) internal {
        require(user != address(0), "invalid user");
        require(amount > 0, "invalid amount");
        require(unlockTime > block.timestamp, "unlock time must be in future");
        require(balanceOf(user) >= _locked[user] + amount, "not enough unlocked balance to lock");

        _locked[user] += amount;
        _locks[user].push(LockEntry({amount: amount, unlockTime: unlockTime, documentCID: documentCID}));
    }

    function _releaseExpiredLocks(address user) internal {
        LockEntry[] storage entries = _locks[user];
        uint256 len = entries.length;
        uint256 writeIdx = 0;

        for (uint256 i = 0; i < len; i++) {
            if (block.timestamp >= entries[i].unlockTime) {
                _locked[user] -= entries[i].amount;
            } else {
                entries[writeIdx] = entries[i];
                writeIdx++;
            }
        }

        while (entries.length > writeIdx) {
            entries.pop();
        }
    }

    function _update(address from, address to, uint256 value) internal virtual override {
        if (from != address(0)) {
            uint256 locked = _locked[from];
            if (locked > 0) {
                uint256 available = balanceOf(from) - locked;
                require(available >= value, "transfer exceeds available unlocked balance");
            }
        }
        super._update(from, to, value);
    }
}
