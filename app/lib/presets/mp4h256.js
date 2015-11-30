/*jshint node:true */
'use strict';

exports.load = function(ffmpeg) {
  ffmpeg
    .format('mp4')
    .videoCodec('libx264')
    .audioChannels(2)
    .audioCodec('libmp3lame')
    .audioFrequency(44100)
};