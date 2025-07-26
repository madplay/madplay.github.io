---
layout:   post
title:    Symbolic Link
author:   Kimtaeng
tags: 	  linux symboliclink symlink 
description: What is a symbolic link, a special kind of file that contains a reference to a file or directory in Linux?
category: Knowledge
lang: en
slug: what-is-a-symbolic-link-in-linux
permalink: /en/what-is-a-symbolic-link-in-linux/
date: "2020-09-02 01:12:58"
comments: true
---

# What Is a Symbolic Link?
It is a special file that contains a reference to a specific file or directory.
You can think of it as similar to a shortcut in Windows.


<br>

# Usage: Create a Symbolic Link
Usage is simple. Use the `ln` command, which uses the `link` system call.
If you pass `-s`, it uses the `symlink` system call and creates a symbolic link.

```bash
$ ln -s [target path] [link path]
```

Target path can be relative or absolute. It is what the symlink points to.
Although uncommon, you can also specify a non-existing target.
See example:

```bash
# Create test file `test.txt`
$ echo "hi" > test.txt

# Create symlink `link_a` to test file
$ ln -s test.txt link_a
$ ls -l
lrwxrwxrwx  1 kimtaeng other    8 2020-09-02 18:39 link_a -> test.txt
-rw-r--r--  1 kimtaeng other    3 2020-09-02 18:38 test.txt
```

<br>

# Usage: Delete a Symbolic Link
Use `rm` to remove a symbolic link.
If you append `/` at the end of symlink name, deletion fails.

```bash
# Create test directory `test`
$ mkdir test

# Create symlink `link_sym` to test directory
$ ln -s test link_sym

# Run delete command
$ rm link_sym/
rm: cannot remove `link_sym/': Is a directory

# Remove `/` and run delete command
$ rm link_sym
```

Important caution: when deleting symlinks to source directories with options like `-r` and `-f`,
files inside original directory can be removed in some cases.

```bash
# Create test directory `test`
$ mkdir test

# Create `test.txt` under `test`
$ echo "hi" > test/test.txt

# Create symlink `link_sym` to test directory
$ ln -s test link_sym

# Run delete command
$ rm -r link_sym/
rm: cannot remove `link_sym': Not a directory

# `test` directory remains, but files inside are deleted
```

<br>

# Usage: Change Symbolic Link Target
When you want to retarget a symbolic link,
you can delete and recreate it, but there is a more efficient method that keeps the link name.

```bash
$ ln -Tfs [new target path] [symbolic link to change]
```

Here, options except `-s` are new.
`-T` treats destination as normal file path.
`-f` overwrites existing symbolic link.
Without `-f`, existing symlink target is not replaced.

Example:

```bash
# Create test directories `test1`, `test2`
$ mkdir test1 && mkdir test2

# Create symlink `link_a` to `test1`
$ ln -s test1 link_a

$ ls -l
lrwxrwxrwx 1 kimtaeng other    5 2020-09-02 18:40 link_a -> test1
drwxr-xr-x 2 kimtaeng other 4096 2020-09-02 18:40 test1
drwxr-xr-x 2 kimtaeng other 4096 2020-09-02 18:40 test2

# Try changing `link_a` to `test2` without overwrite, target remains unchanged
$ ln -s test2 link_a
$ ls -l
lrwxrwxrwx 1 kimtaeng other    5 2020-09-02 18:40 link_a -> test1
drwxr-xr-x 2 kimtaeng other 4096 2020-09-02 18:40 test1
drwxr-xr-x 2 kimtaeng other 4096 2020-09-02 18:40 test2

# Change target using `-Tfs`
$ ln -Tfs test2 link_a
$ ls -l
lrwxrwxrwx 1 kimtaeng other    5 2020-09-02 18:41 link_a -> test2
drwxr-xr-x 2 kimtaeng other 4096 2020-09-02 18:40 test1
drwxr-xr-x 2 kimtaeng other 4096 2020-09-02 18:40 test2
```


<br>

# Hard Link vs Symbolic Link
If you run `ln` without `-s`, it creates a **hard link**.
A hard link has the same `inode` as the original, so it remains usable even when original path is deleted.

You can verify this as below.
Hard link shares inode with original.
Symbolic link has different inode.

```bash
# Create test file `test.txt`
$ echo "hi" > test.txt

# Create symbolic link `link_symbolic` to test file
$ ln -s test.txt link_symbolic

# Create hard link `link_hard` to test file
$ ln text.txt link_ahrd

# Print current directory (including inode)
$ ls -li
164888621 -rw-r--r-- 2 kimtaeng other 3 2020-09-02 18:42 link_hard
164888626 lrwxrwxrwx 1 kimtaeng other 8 2020-09-02 18:42 link_symbolic -> text.txt
164888621 -rw-r--r-- 2 kimtaeng other 3 2020-09-02 18:42 test.txt
```

Now delete original file and compare behavior.

```bash
$ rm test.txt

# Symbolic link
$ cat link_symbolic
cat: link_symbolic: No such file or directory

# Hard link
$ cat link_hard
hi
```

Once a hard link is created, it is effectively the same file on disk.
In this example we call one side original and the other link,
but since original path is also a hard link to inode, this distinction can be conceptually weak.
