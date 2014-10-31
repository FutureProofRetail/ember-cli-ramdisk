'use strict';

var fs = require('fs');
var execSync = require('execSync').exec;
var rimraf = require('rimraf');

var RAMDISK_BYTES = 2 * 1024 * 1024 * 1024;
var BLOCK_SIZE = 512;
var RAMDISK_BLOCKS = RAMDISK_BYTES / BLOCK_SIZE;
var RAMDISK_NAME = "EmberCliRamdisk";
var RAMDISK_PATH = "/Volumes/" + RAMDISK_NAME;

function ramdiskExists() {
  return fs.existsSync(RAMDISK_PATH);
}

function runCommand(command) {
  console.log("ember-cli-ramdisk: " + command);

  var result = execSync(command);
  if (result.code !== 0) {
    throw new Error("ember-cli-ramdisk: error running command(" + result.code + "): " + result.stdout);
  }
  return result.stdout;
}

function removeOldTmpDirectory(projectTmpPath) {
  if (fs.readdirSync(projectTmpPath).length > 0) {
    throw new Error("Your " + projectTmpPath + " directory isn't empty. Please empty it or remove it so that ember-cli-ramdisk can take its place.");
  }
  rimraf.sync(projectTmpPath);
}

function createRamdiskDevice() {
  return runCommand('hdiutil attach -nomount ram://' + RAMDISK_BLOCKS).trim();
}

function mountRamdiskDevice(devicePath) {
  return runCommand("diskutil erasevolume HFS+ " + RAMDISK_NAME + " " + devicePath);
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

  if (!fs.existsSync(ramdiskTmpPath)) {
    fs.mkdirSync(ramdiskTmpPath);
  }

  fs.symlinkSync(ramdiskTmpPath, projectTmpPath, 'dir');
}

module.exports = {
  name: 'ember-cli-ramdisk',
  included: function(app) {

    var projectTmpPath = app.project.root + "/tmp";

    if (process.platform !== 'darwin') {
      console.log("ember-cli-ramdisk presently only supports Mac. No ramdisk will be installed.")
      return;
    }

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
  }
};

