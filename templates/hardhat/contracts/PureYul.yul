object "PureYul" {
	code {
		// constructor
		datacopy(0, dataoffset("runtime"), datasize("runtime"))
		return(0, datasize("runtime"))
	}

	object "runtime" {
		// Return the calldata
		code {
		mstore(0x80, calldataload(0))
		return(0x80, calldatasize())
		}
	}
}
