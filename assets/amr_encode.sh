#! /bin/sh

# Usage: encoder wav_file amr_output
# .sw is a sox shorthand for signed word .raw
# Hope that sox will create correct endian.
sox "$1" -r 8000 "$1".sw resample
amrnb-encoder MR515 "$1".sw "$2"
rm "$1".sw
