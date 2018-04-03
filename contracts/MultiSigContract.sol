pragma solidity ^0.4.21;

contract SimpleMultiSig {
  uint public nonce;                        // (only) mutable state
  mapping (address => bool) public isOwner; // immutable state
  address[] public ownersArr;               // immutable state

  function SimpleMultiSig(address[] owners_) public {
    for (uint i=0; i<owners_.length; i++) {
      isOwner[owners_[i]] = true;
      ownersArr.push(owners_[i]);
    }
  }

  function execute(address destination, uint value, uint8[] sigV, bytes32[] sigR, bytes32[] sigS) public {
    require(sigR.length == sigS.length && sigR.length == sigV.length);
    require(sigR.length == ownersArr.length - 1);
    require(isOwner[msg.sender] == true);

    bytes32 txHash = keccak256(this, destination, value, nonce);

    for (uint i = 0; i < ownersArr.length - 1; i++) {
        address recovered = ecrecover(txHash, sigV[i], sigR[i], sigS[i]);
        require(isOwner[recovered] == true);
    }
    
    nonce = nonce + 1;
    destination.transfer(value);
  }
  
  function () public payable {}
}
