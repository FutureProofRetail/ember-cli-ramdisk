'use strict';

var fs = require('fs');
var execSync = require('execsyncs');
var rimraf = require('rimraf');

var RAMDISK_BYTES = 2 * 1024 * 1024 * 1024;
var BLOCK_SIZE = 512;
var RAMDISK_BLOCKS = RAMDISK_BYTES / BLOCK_SIZE;
var RAMDISK_NAME = "EmberCliRamdisk";
var RAMDISK_PATH = (function(){
  switch (process.platform){
    case "darwin":
      return "/Volumes/" + RAMDISK_NAME;
    case "linux":
      return "/mnt/" + RAMDISK_NAME;
    }
})();

function ramdiskExists() {
  return fs.existsSync(RAMDISK_PATH);
}

function runCommand(command) {
  console.log("ember-cli-ramdisk: " + command);
  try {
    return  execSync(command).toString();
  } catch(e) {
    throw new Error("ember-cli-ramdisk: error running command(" + command + "): " + e.message);
  }
}

function removeOldTmpDirectory(projectTmpPath) {
  if (fs.readdirSync(projectTmpPath).length > 0) {
    throw new Error("Your " + projectTmpPath + " directory isn't empty. Please empty it or remove it so that ember-cli-ramdisk can take its place.");
  }
  rimraf.sync(projectTmpPath);
}

function createRamdiskDevice() {
  switch (process.platform) {
    case "darwin":
      return runCommand('hdiutil attach -nomount ram://' + RAMDISK_BLOCKS).trim();
    case "linux":
      return runCommand('sudo mkdir -p '+RAMDISK_PATH);
  }
}

function mountRamdiskDevice(devicePath) {
  switch (process.platform) {
    case "darwin":
      return runCommand("diskutil erasevolume HFS+ " + RAMDISK_NAME + " " + devicePath);
    case "linux":
      return runCommand('sudo mount -t tmpfs -o size='+RAMDISK_BYTES+' tmpfs '+RAMDISK_PATH);
  }
}

function createRamdiskIfNecessary() {
  if (ramdiskExists()) {
    return;
  }

  var devicePath = createRamdiskDevice();
  mountRamdiskDevice(devicePath);
}

function createSymlink(projectTmpPath, projectName) {
  var ramdiskTmpPath = RAMDISK_PATH + "/" + projectName;

  try { fs.mkdirSync(ramdiskTmpPath); } catch(e) {}

  fs.symlinkSync(ramdiskTmpPath, projectTmpPath, 'dir');
}

module.exports = {
  name: 'ember-cli-ramdisk',
  included: function(app) {

    var projectTmpPath = app.project.root + "/tmp";

    if (process.platform !== 'darwin' && process.platform !== 'linux') {
      console.log("ember-cli-ramdisk presently only supports Mac and Linux. No ramdisk will be installed. Current: "+process.platform);
      return;
    }

    try {
      if (fs.existsSync(projectTmpPath)) {
        if (fs.lstatSync(projectTmpPath).isSymbolicLink()) {
          if (fs.readlinkSync(projectTmpPath).indexOf(RAMDISK_PATH) === -1) {
            throw new Error("It seems like you've already symlinked your tmp directory elsewhere; please rm it and try again.");
          }
          return;
        }
        removeOldTmpDirectory(projectTmpPath);
      }

      createRamdiskIfNecessary();
      createSymlink(projectTmpPath, app.project.pkg.name);
      console.log("ember-cli-ramdisk: your ramdisk has been created at " + RAMDISK_PATH + ". Enjoy your speedy builds.");
    } catch(e) {
      console.log("ember-cli-ramdisk: WARNING: failed to install ramdisk: ", e.stack);
    }
  }
};
