(function (global) {

var util = AMR.util;


function AMREncoder(options) {
	this.params = options;
	
	this.mode = options.mode || 5; // MR795 by default

	this.frame_size = 160;

	this.block_size = AMR.modes[this.mode];

	this.dtx = (options.dtx + 0) || 0;
}

AMREncoder.prototype.init = function () {
	var options = this.options;
	var ptr = opencoreamr.allocate(1, 'i32', opencoreamr.ALLOC_STACK), ret, encSize;

	/* Create Encoder */
	this.state = opencoreamr.Encoder_Interface_init(this.dtx);

	this.input = opencoreamr.allocate(this.frame_size, 'i16', opencoreamr.ALLOC_STATIC);	
	this.buffer = opencoreamr.allocate(this.block_size, 'i8', opencoreamr.ALLOC_STATIC);
}

/**
  * Copy the samples to the input buffer
  */
AMREncoder.prototype.read = function (offset, length, data) {
	var input_addr = this.input
	  , len = offset + length > data.length ? data.length - offset : length;

	for (var m=offset-1, k=0; ++m < offset+len; k+=2){
		opencoreamr.setValue(input_addr+k, data[m], 'i16');
	}

	return len;
}

AMREncoder.prototype.writeMagicNumber = function () {
	for (var i=-1; ++i<6; ) {
		this.output[i] = AMR.MAGIC_NUMBER[i];
	}
}

/* Copy to the output buffer */
AMREncoder.prototype.write = function (offset, nb, addr) {	
	var bits;
  	for (var m=0, k=offset-1; ++k<offset+nb; m+=1) {
  		bits = opencoreamr.getValue(addr+m, "i8");
  		this.output[k] = bits;
  	}  	
}

AMREncoder.prototype.process = function (pcmdata) {
	benchmark && console.time('encode');
	var output_offset = 0, offset = 0, len, nb, err, tm_str
	  , benchmark = !!this.benchmark	  
	  , total_packets = Math.ceil(pcmdata.length / this.frame_size)
	  , estimated_size = this.block_size * total_packets
	  , buffer_len_ptr = opencoreamr.allocate(1, 'i32', opencoreamr.ALLOC_STACK);

	if (!this.output || this.output.length < estimated_size) {
		this.output = new Uint8Array(estimated_size + 6);
	}

	this.writeMagicNumber();
	output_offset += 6;

	var bits_addr = this.bits
	  , input_addr = this.input
	  , buffer_addr = this.buffer
	  , state_addr = this.state;
	
	while (offset < pcmdata.length) {
		benchmark && console.time('encode_packet_offset_'+offset);
		
		/* Frames to the input buffer */
		len = this.read(offset, this.frame_size, pcmdata);	
		
    	/* Encode the frame */
    	nb = opencoreamr.Encoder_Interface_Encode(this.state, this.mode
	    	, input_addr, buffer_addr, 0);

    	/* Write the size and frame */
    	this.write(output_offset, nb, buffer_addr);

    	benchmark && console.timeEnd('encode_packet_offset_'+offset);

    	output_offset += nb;
    	offset += len;
	}

	benchmark && console.timeEnd('encode');

	return this.output.subarray(0, output_offset);
}


AMREncoder.prototype.close = function () {
	opencoreamr.Encoder_Interface_exit(this.state);
}

global["AMREncoder"] = AMREncoder;

}(this));