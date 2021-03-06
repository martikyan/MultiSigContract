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
	const Executer = accounts[4];

	beforeEach("deploy the contract", async () => {
		multiSigContract = await MultiSigContract.new(addressArray, Executer, {
			from: randomAccount
		});
	});

	it("should have correct fields after initializing", async function () {
		// Act & Assert
		assert.equal(false, await multiSigContract.IsSigner(randomAccount));
		assert.equal(true, await multiSigContract.IsSigner(addressArray[0]));
		assert.equal(false, await multiSigContract.IsSigner(Executer));
		assert.equal(addressArray[0], await multiSigContract.Signers(0));
	});

	it("should accept ether transfer to itself", async function () {
		// Act
		await multiSigContract.sendTransaction({
			value: 100,
			from: randomAccount
		});
		await multiSigContract.sendTransaction({
			value: 50,
			from: Executer
		});
		// Assert
		assert.equal(150, await web3.eth.getBalance(multiSigContract.address));
	});

	it("should not allow to transfer ether to destination if the transaction is not valid", async function () {
		// Arrange
		destination = randomAccount;
		var amount = 42;
		var wdwId = 0;

		await multiSigContract.sendTransaction({
			value: amount + 20000,
			from: randomAccount
		});
		// Act
		var hexMessageToSign = multiSigContract.address + destination.slice(2) + getAsUInt32StringHex(amount) + getAsUInt32StringHex(wdwId);
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

		// Assert
		assertEx.isReverted(async () => await multiSigContract.execute("0x0", amount, wdwId, sigV, sigR, sigS, {
			from: Executer
		}));
		assertEx.isReverted(async () => await multiSigContract.execute(destination, amount - 1, wdwId, sigV, sigR, sigS, {
			from: Executer
		}));
		assertEx.isReverted(async () => await multiSigContract.execute(destination, amount, wdwId + 1, sigV, sigR, sigS, {
			from: Executer
		}));
		assertEx.isReverted(async () => await multiSigContract.execute(destination, amount, wdwId, sigV, sigR, sigS, {
			from: addressArray[0]
		}));
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
		// Act
		var hexMessageToSign = multiSigContract.address + destination.slice(2) + getAsUInt32StringHex(amount) + getAsUInt32StringHex(wdwId);
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
		// Assert
		await multiSigContract.execute(destination, amount, wdwId, sigV, sigR, sigS, {
			from: Executer
		});
	});
});