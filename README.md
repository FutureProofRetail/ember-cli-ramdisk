## ember-cli-ramdisk

`ember-cli` addon that mounts your broccoli `tmp` folder in RAM 
for speedier builds.

Presently only supports OS X (Darwin).

## Installation

From your ember-cli project folder:

    npm install ember-cli-ramdisk --save-dev

## Background

`ember-cli` uses Broccoli as a build tool, and Broccoli uses a `tmp`
folder in your project's directory for storing intermediate files during
the build process, which means they are getting stored on your hard 
drive. 

Most operating systems allow you to mount file systems into memory,
which results in faster read/write operations with the obvious tradeoff
being that if your computer restarts, you'll lose any data mounted on
the ramdisk.

But for temporary folders that are often read/written into, you can get
some performance gains by mounting them to a ramdisk, which is what this
ember addon does. 

## Details

This addon will:

1. Mount a ramdisk at `/Volumes/EmberCliRamdisk`
2. Replace your project's `tmp` folder with a symlink to
   `/Volumes/EmberCliRamdisk/your-project-name`

Multiple projects can use this addon and share the same ramdisk.

The ramdisk does not automatically unmount after you kill broccoli, but
can easily be unmounted from the side menu in Finder.

## TODO

1. Tests
2. Support for OSs other than Mac (darwin)
3. Replace execSync with something nicer (can't right now since
   `include` doesn't wait for any returned promises)

