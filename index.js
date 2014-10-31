'use strict';

var fs = require('fs');
var execSync = require('execSync').exec;
var rimraf = require('rimraf');

var TMP_PATH = "./tmp";
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

function removeOldTmpDirectory() {
  if (fs.readdirSync(TMP_PATH).length > 0) {
    throw new Error("Your " + TMP_PATH + " directory isn't empty. Please empty it or remove it so that ember-cli-ramdisk can take its place.");
  }
  rimraf.sync(TMP_PATH);
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

function createSymlink(projectName) {
  var ramdiskTmpPath = RAMDISK_PATH + "/" + projectName;

  if (!fs.existsSync(ramdiskTmpPath)) {
    fs.mkdirSync(ramdiskTmpPath);
  }

  fs.symlinkSync(ramdiskTmpPath, TMP_PATH, 'dir');
}

module.exports = {
  name: 'ember-cli-ramdisk',
  included: function(app) {
    if (process.platform !== 'darwin') {
      console.log("ember-cli-ramdisk presently only supports Mac. No ramdisk will be installed.")
      return;
    }

    if (fs.existsSync(TMP_PATH)) {
      if (fs.lstatSync(TMP_PATH).isSymbolicLink()) {
        if (fs.readlinkSync(TMP_PATH).indexOf(RAMDISK_PATH) === -1) {
          throw new Error("It seems like you've already symlinked your tmp directory elsewhere; please rm it and try again.");
        }
        return;
      }
      removeOldTmpDirectory();
    }

    createRamdiskIfNecessary();
    createSymlink(app.project.pkg.name);
    console.log("ember-cli-ramdisk: your ramdisk has been created! Enjoy your speedy builds.");
  }
};
