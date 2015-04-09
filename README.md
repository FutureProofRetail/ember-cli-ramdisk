# NOTE:

This addon isn't as useful as it use to be. See the Impact section
below.

## ember-cli-ramdisk

`ember-cli` addon that mounts your broccoli `tmp` folder in RAM
for speedier builds.

Presently only supports OS X (Darwin) and Linux.

## Installation

From your ember-cli project folder:

    npm install ember-cli-ramdisk --save-dev

## Motivation

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

## Impact

At this point, if you're using an up-to-date version of ember-cli, you
probably won't notice an improvement in build times from this addon.

Another use case for this addon is to prevent things like: 
* [SSD thrash](https://github.com/ember-cli/ember-cli/issues/2226#issuecomment-62065304),
* slow writes to magnetic drives
* fragmenting on Copy-On-Write filesystems like btrfs - see  (http://blog.ieugen.ro/2015/03/my-experience-with-btrfs-on-debian.html)

## Details

This addon will:

1. Mount a ramdisk at
 - OS X - `/Volumes/EmberCliRamdisk`
 - Linux - `/mnt/EmberCliRamdisk`
2. Replace your project's `tmp` folder with a symlink to
   `/Volumes/EmberCliRamdisk/your-project-name` or `/mnt/EmberCliRamdisk/your-project-name`

Multiple projects can use this addon and share the same ramdisk.

The ramdisk does not automatically unmount after you kill broccoli, but
can easily be unmounted from the side menu in Finder.

To unmount the ramdisk in linux you must run `sudo umount /mnt/EmberCliRamdisk` and `sudo rm -R /mnt/EmberCliRamdisk/`.

## TODO

1. Tests
2. Support for OSs other than Mac (darwin) and Linux
3. Replace execSync with something nicer (can't right now since
   `include` doesn't wait for any returned promises)
