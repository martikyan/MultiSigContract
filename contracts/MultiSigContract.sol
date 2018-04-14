pragma solidity ^0.4.18;

contract MultiSigContract {
    mapping (uint => bool) public WithdrawIDs;
    mapping (address => bool) public IsSigner;
    address public Executer;
    address[] public Signers;

    function MultiSigContract(address[] _signers, address _executer) public {
        require(_executer != 0x0);
        Signers = _signers;
        Executer = _executer;
        for (uint i = 0; i < Signers.length; i++) {
            IsSigner[Signers[i]] = true;
        }        
    }

    function execute(address destination, uint amount, uint wdwId, uint8[] sigV, bytes32[] sigR, bytes32[] sigS) public returns (address) {
        require(sigR.length == sigS.length && sigR.length == sigV.length);
        require(sigR.length == Signers.length);
        require(msg.sender == Executer);
        require(WithdrawIDs[wdwId] == false);
        require(address(this).balance >= amount);

        bytes32 txHash = keccak256("\x19Ethereum Signed Message:\n104", this, destination, amount, wdwId);

        for(uint8 i = 0; i < Signers.length; i++) {
            address recovered = ecrecover(txHash, sigV[i], sigR[i], sigS[i]);
            require(IsSigner[recovered] == true);
        }
        WithdrawIDs[wdwId] = true;
        destination.transfer(amount);
    }
  
    function () public payable {}
}