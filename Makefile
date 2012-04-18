CLOSURE_COMPILER_PATH=bin/closure_compiler.jar

all: bundle-nb

bundle-nb: 
	cat src/libamr-nb.js > dist/amrnb.js	
	cat src/util.js >> dist/amrnb.js
	cat src/amr.js >> dist/amrnb.js
	cat src/codec.js >> dist/amrnb.js
	cat src/decoder.js >> dist/amrnb.js
	cat src/encoder.js >> dist/amrnb.js
	java -jar $(CLOSURE_COMPILER_PATH) --js=dist/amrnb.js > dist/amrnb.min.js

clean:
	rm dist/amr*

.PHONY: bundle-nb clean
