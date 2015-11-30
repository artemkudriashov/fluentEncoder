var express = require('express');
var multer  = require('multer');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var htmlStringify = require('html-stringify');


var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.use(express.static(__dirname + '/files/'));


var upload = multer({ dest: './files/'});
var log ={};

app.post('/', upload.array('files',2), function(req, res, next){
    console.log(req.files);
    wrapper(req, res, next);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;

function deleteFile (file) {
    fs.unlink(file, function (err) {
        if (err) throw err;
        console.log('successfully deleted ' + file);
    });
}


var outFile = "./files/outover.mp4";

function wrapper(req, res, next) {

    encode(req.files[0].path, req.files[1].path);

    function encode(videoFile, audioFile) {


        var tempFile = "./files/temp.mp4"

        var proc = ffmpeg();

        for (var i = 0; i < 3; i++) proc.input(videoFile);

        proc.preset('../../../../lib/presets/mp4h256.js')

        proc.on('start', function (cmdline) {
            console.log('Command line: ' + cmdline);
        })
            .on('progress', function (info) {
                console.log('progress ' + info.percent + '%');
            })
            .on('end', function () {
                console.log('files have been encoded and loopped succesfully');
                deleteFile(videoFile);
                overlay(audioFile, tempFile);
            })
            .on('error', function (err, stdout, stderr) {
                console.log(" =====Convert Video Failed======");
                console.log(err);
                console.log("stdout: " + stdout);
                console.log("stderr: " + stderr);
                res.render('error', {
                    message: err.message,
                    error: err
                });
                deleteFile(videoFile);
                deleteFile(audioFile);
                deleteFile(tempFile);
            })
            .mergeToFile(tempFile);
    };

    function overlay(audioFile, tempFile) {

        var proc = ffmpeg(audioFile)
            .input(tempFile)
            .preset('../../../../lib/presets/mp4h256.js')
            .on('start', function (cmdline) {
                console.log('Command line: ' + cmdline);
            })
            .on('progress', function (info) {
                console.log('progress ' + info.percent + '%');
            })
            .on('end', function () {
                deleteFile(tempFile);
                deleteFile(audioFile);
                console.log('files have been merged succesfully');
                var procout = ffmpeg.ffprobe(outFile,function(err, data) {
                    res.render('video', { title: 'Sympler the result page', probedata: htmlStringify(data) });
                });
                //res.render('video', { title: 'Sympler the result page', probedata: "Outfile:"+procout });
            })
            .on('error', function (err, stdout, stderr) {
                console.log(" =====Convert Video Failed======");
                console.log(err);
                console.log("stdout: " + stdout);
                console.log("stderr: " + stderr);
                res.render('error', {
                    message: err.message,
                    error: err
                });
                deleteFile(tempFile);
                deleteFile(audioFile);
            })
            .outputOptions(['-filter_complex', '[0:a][1:a]amerge=inputs=2[aout]', '-map', '1:v', '-map', '[aout]', '-ac', '2', '-shortest'])
            .output(outFile)
            .run();
    }
}
