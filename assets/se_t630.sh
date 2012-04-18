#! /bin/sh

amrnb-decoder se_t630.amr se_t630.raw
aplay -t raw -c 1 -r 8000 -f S16_LE se_t630.raw
