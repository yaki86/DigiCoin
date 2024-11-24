// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DigiCoin is Ownable {
    event TransferRecorded(string from, string to, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function recordTransfer(string memory from, string memory to, uint256 amount) public onlyOwner {
        emit TransferRecorded(from, to, amount);
    }
}


