// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DigiCoin is Ownable {
    event TransferRecorded(string from, string to, string amount);

    constructor() Ownable(msg.sender) {}

    function recordTransfer(string memory from, string memory to, string memory amount) public onlyOwner {
        emit TransferRecorded(from, to, amount);
    }
}


