function startCapture() {
    var codec = new AMR()
      , sink = new Audio()
      , buffer_size = 2304;
    
    sink["mozSetup"] && sink.mozSetup(1, 8000);

    function onCaptureError (err) {
        console.error(err);
    }

    function onSamplesDec (samples) {                
        var wavData = atob(samples)
          , data = new Int16Array(new ArrayBuffer(wavData.length - 44))
          , encoded, decoded;
        
        if (data.length > buffer_size) {
            console.log("too much samples: size=", data.length);
            return;
        }

        try {

        for (var i=44, j=-1; ++j < data.length; i+=2) {
            data[j] = Binary.toInt16(wavData.substr(i, 2));
        }
        
        encoded = codec.encode(data);        
        if (!!encoded){
            decoded = codec.decode(encoded)
            sink["mozWriteAudio"] && sink.mozWriteAudio(decoded);
            !sink["mozWriteAudio"] && AMR.util.play(decoded);
        } 
        // XXX - DEBUG only    
        } catch (err) {
            console.error(err);
        }
    }

    function onRecordingComplete(data) {}

    navigator.device.captureAudio(onRecordingComplete, onCaptureError, {
        codec: "AMR"
      , raw: true
      , onsamples: onSamplesDec
    });
}

document.getElementById('flash-capture').addEventListener('click', startCapture, false);