var MultiSigContract = artifacts.require("./MultiSigContract.sol");
var assertEx = require("./utility/assertExtensions.js");

initialWalletBalance = 1000000;

contract("MultiSigContract", function(accounts) {
	addressArray = []
	addressArray.push(accounts[0]);
	addressArray.push(accounts[1]);
	addressArray.push(accounts[2]);
	addressArray.push(accounts[3]);

	const randomAccount = accounts[5];
	const lastSigner = accounts[4];
	addressArray.push(lastSigner);
	
	beforeEach("deploy the contract", async () => {
		multiSigContract = await MultiSigContract.new(addressArray, {
			from: lastSigner
		});

		web3.eth.sendTransaction({
			from: randomAccount,
			to: addressArray[0],
			value: initialWalletBalance
		});
		web3.eth.sendTransaction({
			from: randomAccount,
			to: addressArray[1],
			value: initialWalletBalance
		});
		web3.eth.sendTransaction({
			from: randomAccount,
			to: addressArray[2],
			value: initialWalletBalance
		});
		web3.eth.sendTransaction({
			from: randomAccount,
			to: addressArray[3],
			value: initialWalletBalance
		});
	});

	it("should have correct fields after initializing", async function() {
		// Act & Assert
		assert.equal(0, await multiSigContract.nonce());
		assert.equal(false, await multiSigContract.isOwner(randomAccount));
		assert.equal(true, await multiSigContract.isOwner(addressArray[0]));
		assert.equal(true, await multiSigContract.isOwner(addressArray[4]));
		assert.equal(addressArray[0], await multiSigContract.ownersArr(0));
		assert.equal(addressArray[4], await multiSigContract.ownersArr(4));
	});

	it("should accept ether transfer to itself", async function() {
		// Act
		await multiSigContract.sendTransaction({
			value: 100,
			from: randomAccount
		});
		await multiSigContract.sendTransaction({
			value: 50,
			from: addressArray[4]
		});
		// Assert
		assert.equal(150, await web3.eth.getBalance(multiSigContract.address));
	});

	it("should not allow to transfer ether to destination if the transaction is not valid", async function() {});

	it("should allow to transfer ether to destination if the transaction is valid", async function() {
		// Arrange
		destination = randomAccount;
		value = 500;
		nonce = await multiSigContract.nonce();
		await multiSigContract.sendTransaction({
			value: value + 200000,
			from: randomAccount
		});
		destinationInitialBalance = web3.eth.getBalance(multiSigContract.address);
		// Act
		sigR = [];
		sigS = [];
		sigV = [];

		var signedData = "";
		signedData += multiSigContract.address;
		signedData += destination.slice(2);
		signedData += value.toString(16);
		signedData += nonce.toString(16);
		signedData = web3.sha3(signedData, 'hex');

		
		for(i = 0; i < 4; i++) {
			signedData = web3.eth.sign(addressArray[0], signedData).slice(2);
			sigR.push('0x' + signedData.slice(0,64));
			sigS.push('0x' + signedData.slice(64,128));
			numSigV = parseInt(signedData.slice(128,130))
			numSigV += 27
			sigV.push(numSigV);
			console.log('sigv is ' + numSigV); 
		}

		console.log(destination + ' is the desti');
		console.log(value + ' is the value');
		console.log(sigV + ' is the sigV');
		console.log(sigR + ' is the sigR');
		console.log(sigS + ' is the sigS');
		console.log('balance of the contract is ' + web3.eth.getBalance(multiSigContract.address))
		await multiSigContract.execute(destination, value, sigV, sigR, sigS, {from: addressArray[4]});
	});
});