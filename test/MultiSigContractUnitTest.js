var MultiSigContract = artifacts.require("./MultiSigContract.sol");
var assertEx = require("./utility/assertExtensions.js");

initialWalletBalance = 1000000;

function getAsUInt32StringHex(number) {
	var valueBuffer = Buffer.alloc(32);
	valueBuffer.writeIntLE(number, 0);
	valueBuffer = valueBuffer.toString('hex').match(/.{2}/g).reverse().join(""); // convert to string as hex and reverse
	return valueBuffer;
}

contract("MultiSigContract", function (accounts) {
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

	it("should have correct fields after initializing", async function () {
		// Act & Assert
		assert.equal(false, await multiSigContract.isOwner(randomAccount));
		assert.equal(true, await multiSigContract.isOwner(addressArray[0]));
		assert.equal(true, await multiSigContract.isOwner(addressArray[4]));
		assert.equal(addressArray[0], await multiSigContract.ownersArr(0));
		assert.equal(addressArray[4], await multiSigContract.ownersArr(4));
	});

	it("should accept ether transfer to itself", async function () {
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

	it("should not allow to transfer ether to destination if the transaction is not valid", async function () {
		// TBD
	});

	it("should allow to transfer ether to destination if the transaction is valid", async function () {
		// Arrange
		destination = randomAccount;
		var amount = 42;
		var wdwId = 0;

		await multiSigContract.sendTransaction({
			value: amount + 20000,
			from: randomAccount
		});
		destinationInitialBalance = web3.eth.getBalance(multiSigContract.address);
		// Act

		var hexMessageToSign = multiSigContract.address + randomAccount.slice(2) + getAsUInt32StringHex(amount) + getAsUInt32StringHex(wdwId);
		sigR = [];
		sigS = [];
		sigV = [];

		for (let i = 0; i < 4; i++) {
			signedData = web3.eth.sign(addressArray[i], hexMessageToSign).slice(2);
			sigR.push('0x' + signedData.slice(0, 64));
			sigS.push('0x' + signedData.slice(64, 128));
			numSigV = parseInt(signedData.slice(128, 130))
			numSigV += 27
			sigV.push(numSigV);
		}

		await multiSigContract.execute(randomAccount, amount, wdwId, sigV, sigR, sigS, {
			from: addressArray[4]
		});
	});
});