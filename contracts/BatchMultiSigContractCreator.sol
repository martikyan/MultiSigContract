//This contract is for testing/debugging use only
pragma solidity ^0.4.18;

import "./MultiSigContract.sol";

contract BatchMultiSigContractCreator {
    address[] public CreatedContracts;
    address[] public Signers;
    address public Executer;

    function SetSignersArray(address[] newSignersArr) public {
        Signers = newSignersArr;
    }

    function SetExecuter(address newExecuter) public {
        Executer = newExecuter;
    }
    
    function GetCreatedContractsLength() public view returns (uint) {
        return CreatedContracts.length;
    }

    function GenerateContracts(uint8 count) public returns (address[]) {
        require(Executer != 0x0);
        require(Signers.length != 0);
        
        address[] memory emptyAddressArr;
        CreatedContracts = emptyAddressArr;
        for(uint8 i = 0; i < count; i++) {
            CreatedContracts.push(address(new MultiSigContract(Signers, Executer)));
        }
        return CreatedContracts;
    }
}