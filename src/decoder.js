/**
  * Different modes imply different block sizes:
  * modes = MR475, MR515, MR59, MR67, MR74, MR795, MR102, MR122, MRSID
  * indexes =   0,     1,    2,    3,    4,     5,     6,     7,     8
  * bits =     12, 	  13,   15,   17,   19,    20,    26,    31,     5
  * samples =  160
  */
function AMRDecoder(options) {
	this.params = options;

	this.block_size = 20;
	this.frame_size = 160;
}

AMRDecoder.prototype.init = function () {	
	var options = this.options;	
	
	/* Create decoder */
	this.state = opencoreamr.Decoder_Interface_init();

	// 'XXX' - change to parameters

	// Input Buffer
    this.input = opencoreamr.allocate(20, 'i8', opencoreamr.ALLOC_STATIC);
	
	// Buffer to store the audio samples
    this.buffer = opencoreamr.allocate(160, 'i16', opencoreamr.ALLOC_STATIC);
}

AMRDecoder.prototype.validate = function (magic) {
	var is_str = magic.constructor == String;
	if (is_str) {
		return (magic === "#!AMR\n");
	}

	for (var i = -1; ++i<6; ) {
		if (magic[i] != AMR.MAGIC_NUMBER[i]){
			return false
		}
	}
	
	return true;
}

/**
  * Copy the samples to the input buffer
  */
AMRDecoder.prototype.read = function (offset, data) {
	// block_size = 31 ==> [mode(1):frames(30)]
	var is_str = data.constructor == String.prototype.constructor;
	var dec_mode = is_str ? Binary.toUint8(data[0]) : data[0];
	
	var nb = AMR.modes[(dec_mode >> 3) & 0x000F];
	var input_addr = this.input
	  , len = offset + nb > data.length ? data.length - offset : nb
	  , bits;

	for (var m=offset-1, k=0; ++m < offset+len; k+=1){
		bits = !is_str ? data[m] : Binary.toUint8(data[m]);
		opencoreamr.setValue(input_addr+k, bits, 'i8');
	}

	return len;
}


AMRDecoder.prototype.process = function (data) {
	var is_str = data.constructor == String
	  , head = is_str ? data.substring(0, 6) : data.subarray(0, 6);

	if (!this.validate(head)) {
		return;
	}

	data = is_str ? data.substr(6) : data.subarray(6);

	var output_offset = 0, offset = 0, len;

	// Varies from quality
	var total_packets = Math.ceil(data.length / this.block_size)
	  , estimated_size = this.frame_size * total_packets
	  , benchmark = !!this.params.benchmark
	  , tot = 0;
	benchmark && console.time('decode');
	var input_addr = this.input
	  , buffer_addr = this.buffer
	  , state_addr = this.state;
		
	if (!this.output || this.output.length < estimated_size) {
		this.output = new Float32Array(estimated_size);		
	}
	
	while (offset < data.length) {	
		/* Benchmarking */
		benchmark && console.time('decode_packet_offset_' + offset);

		/* Read bits */
		len = this.read(offset, data);

  		/* Decode the data */
  		opencoreamr.Decoder_Interface_Decode(state_addr, input_addr, buffer_addr, 0);

  		/* Write the samples to the output buffer */
  		this.write(output_offset, this.frame_size, buffer_addr);

  		/* Benchmarking */
  		benchmark && console.timeEnd('decode_packet_offset_' + offset);

  		offset += len + 1;
  		output_offset += this.frame_size;
  		++tot;
  	}

  	benchmark && console.timeEnd('decode');
  	return this.output.subarray(0, output_offset);
}

/**
  * Copy to the output buffer 
  */
AMRDecoder.prototype.write = function (offset, nframes, addr) {	
	var bits;
  	for (var m=0, k=offset-1; ++k<offset+nframes; m+=2) {
		bits = opencoreamr.getValue(addr+m, "i16");
  		this.output[k] = bits / 32768;
  	}
}

AMRDecoder.prototype.close = function () {	
	opencoreamr.Decoder_Interface_exit(this.state);
}
