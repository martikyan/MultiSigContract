pragma solidity ^0.4.18;

contract MultiSigContract {
    mapping (uint => bool) public withdrawIDs; // (only) mutable state
    mapping (address => bool) public isOwner;  // immutable state
    address[] public ownersArr;                // immutable state

    function MultiSigContract(address[] owners_) public {
        for (uint i=0; i<owners_.length; i++) {
            isOwner[owners_[i]] = true;
            ownersArr.push(owners_[i]);
        }
    }

    function execute(address destination, uint amount, uint wdwId, uint8[] sigV, bytes32[] sigR, bytes32[] sigS) public returns (address) {
        require(sigR.length == sigS.length && sigR.length == sigV.length);
        require(sigR.length == ownersArr.length - 1);
        require(msg.sender == ownersArr[ownersArr.length - 1]);
        require(withdrawIDs[wdwId] == false);

        bytes32 txHash = keccak256("\x19Ethereum Signed Message:\n104", this, destination, amount, wdwId);

        for(uint8 i = 0; i < ownersArr.length - 1; i++) {
            address recovered = ecrecover(txHash, sigV[i], sigR[i], sigS[i]);
            require(isOwner[recovered] == true);
        }
        withdrawIDs[wdwId] = true;
        destination.transfer(amount);
    }
  
    function () public payable {}
}