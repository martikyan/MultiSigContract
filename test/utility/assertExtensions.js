module.exports.isReverted = async function(asyncBlock) {
	try {
		await asyncBlock();
	} catch (error) {
		assert.isAbove(error.message.search('revert'), -1, 'Error containing "revert" must be returned');
		return;
	}

	assert.fail("Expected an error containing revert, but received no error.");
}