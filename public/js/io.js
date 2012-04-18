function handleFileSelect(evt, isTypedArray) {
    var f = evt.target.files[0]; // File Object

    // Loop through the FileList and render image files as thumbnails.
    var reader = new FileReader();


	reader.onload = (function (file) {
		return function (e) {
			var extension = file.name.split(".")[1];

			if (extension === "amr") {
				var samples = new AMR({
				   	benchmark: true
				}).decode(e.target.result);

				AMR.util.play(samples);
			} else if (extension == "wav") {
				var data = e.target.result;
				encodeWAV(data);
			} else if (extension == "pcm" && isTypedArray) {
				encodeRawPCM(new Int16Array(e.target.result));
			}
		}
	})(f);
    	
	// Read the file as an ArrayBuffer
    if (!!isTypedArray) {
    	reader.readAsArrayBuffer(f);	
		return;
	}
	
	// Read the file as a Binary String
    reader.readAsBinaryString(f);
}

function encodeRawPCM(data) {
	var fdata = new Float32Array(data.length);

	for (var i=-1; ++i<data.length;) {
		fdata[i] = data[i] / 32767;
	}

	// Just plays
	var wavData = PCMData.encode({
		sampleRate: 8000
	  , channelCount: 1
	  , bytesPerSample: 2
	  , data: fdata
	});				

	element = new Audio();
	element.src = "data:audio/wav;base64,"+btoa(wavData);
	//element.play();
	
	var begin = Date.now(), end, times
	  ,	ret
	  , binaryString;

	encodeBytes(data)	
}

function encodeBytes(pcmData) {
	var BlobBuilder = window["WebKitBlobBuilder"] || window["MozBlobBuilder"] || window["BlobBuilder"];
	var bb = new BlobBuilder();
	bb.append(pcmData);
	buffer = null;

	var reader = new FileReader();	
	reader.onload = function (e) {		 		
		var frames, bytes
		  , begin, end, times
		  ,	ret
		  , data = e.target.result
		  , shorts =  pcmData.constructor.prototype == String.prototype ? new Int16Array(data) : pcmData;

		/**
		  * Encode PCM (byte)
		  */
		console.warn("encode pcm int data");
		var codec = new AMR({
		   	benchmark: true
		})

		var frames = codec.encode(shorts, true);
				
		AMR.util.play(codec.decode(frames));

	};

	reader.readAsArrayBuffer(bb.getBlob());
}

function encodeWAV (data) {
	var isFloatArray = data.constructor.prototype == Float32Array.prototype;
		var frames, bytes, begin, end, times, ret
		  , buffer = data;

		var shorts = !isFloatArray ? new Int16Array(buffer) : data;

		console.log("Byte Length: ", shorts.byteLength);
		console.log("Shorts Length: ", shorts.length);
		
		/**
		  * Encode PCM (byte)
		  */
		console.warn("encode pcm int data");
		begin = Date.now();

		var codec = new AMR({
		   	benchmark: true
		});
		
		var data = codec.encode(shorts, true);
		
		AMR.util.play(codec.decode(data));
		
		codec.close();
}

document.getElementById('file').addEventListener('change', function (evt) {
	handleFileSelect(evt);
}, false);

document.getElementById('play_wav').addEventListener('change', function (evt) {
	handleFileSelect(evt, true);
}, false);

document.getElementById('play').addEventListener('change', function (evt) {
	handleFileSelect(evt, true);
}, false);
