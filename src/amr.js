(function (global) {

function AMR(params) {
	!params && (params = {});
	this.params = params;

	this.frame_size = 320 || params.frame_size;

	this.ring_size = 2304 || params.ring_size;
	
  this.linoffset = 0;

  this.ringoffset = 0;

  this.modoffset = 0;
    
  this.linbuf = new Int16Array(this.frame_size);

  this.ring = new Int16Array(this.ring_size * 2);

  this.modframes = new Int16Array(this.frame_size);
  
  this.framesbuf = [];
	
	this.decoder = new AMRDecoder(params);
	this.encoder = new AMREncoder(params);	

	this.init();
}

AMR.util = global.util;

AMR.prototype.init = function () {	
	this.encoder.init();
	this.decoder.init();
}

AMR.prototype.set = function (name, value) {	
	this.options[name] = value;
}

AMR.prototype.enable = function (option) {	
	this.set(option, true);
}

AMR.prototype.disable = function (option) {	
	this.set(option, false);
}

/**
  * Initialize the codec
  */
AMR.prototype.init = function () {	
	this.encoder.init();
	this.decoder.init();
}

/**
  * @argument pcmdata Float32Array|Int16Array
  * @returns String|Uint8Array
  */
AMR.prototype.encode = function (data, isFile) {
	isFile = !!isFile;

	if (isFile) {
		return this.encoder.process(data);
	}

	// ring spin
    for (var i=-1, j=this.ringoffset; ++i < data.length; ++j) {
        this.ring[j] = data[i];
    }
    
    this.ringoffset += data.length;

    // has enough to decode
    if ((this.ringoffset > this.linoffset) 
    	&& (this.ringoffset - this.linoffset < this.frame_size)) {
        
        return;
    }

    // buffer fill
    for (var i=-1; ++i < this.linbuf.length;) {
        this.linbuf[i] = this.ring[this.linoffset + i];            
    }

    this.linoffset += this.linbuf.length;
    this.framesbuf = this.encoder.process(this.linbuf);

    if (this.ringoffset > this.ring_size) {
        this.modoffset = this.ringoffset % this.ring_size;
        
        //console.log("ignoring %d samples", this.modoffset);
        this.ringoffset = 0;
    }

    if (this.linoffset > this.ring_size) {
        this.linoffset = 0;
    }

    return this.framesbuf;
}

/**
  * @argument encoded String|Uint8Array
  * @returns Float32Array
  */
AMR.prototype.decode = function (bitstream) {
	return this.decoder.process(bitstream);
}

/**
  * Closes the codec
  */
AMR.prototype.close = function () {
	this.encoder.close();
	this.decoder.close();
}

AMR.onerror = function (message, code) {
	console.error("AMR Error "+code+": "+message);
}

util.merge(AMR, {
	MAGIC_NUMBER: [35, 33, 65, 77, 82, 10]
  , MAGIC_NUMBER_STRING: "#!AMR\n"
  
  	/** Decoding modes and its frame sizes (bytes), respectively */
  , modes: {
		0: 12
	  , 1: 13
	  ,	2: 15
	  ,	3: 17
	  , 4: 19
	  , 5: 20
	  , 6: 26
	  , 7: 31
	  , 8:  5
	}
});

global.AMR = AMR;
}(this));