---
layout:   post
title:    Java File Compression and Decompression (ZipInputStream, ZipOutputStream)
author:   madplay
tags: 	  Java ZipOutputStream
description: Java file compression and decompression using java.util.zip package
category: Java
date: "2018-02-03 21:31:29"
comments: true
slug:     java-file-zip
lang:     en
permalink: /en/post/java-file-zip
---

# File Compression and Decompression in Java
Java provides file compression and decompression functionality by default.
Using the `java.util.zip` package, you can handle zip extension files that we commonly use.

This package contains filter streams that compress streams into zip or gzip extension files or conversely decompress them,
and you can develop Java programs that exchange compressed data through networks using this.

<br>

# File Compression Example
Examining code that compresses files using streams:

```java
import java.io.IOException;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Java file compression example
 *
 * @author Kimtaeng
 * Created on 2018. 1. 3
 */
public class MadPlay {
    private final int MAX_SIZE = 1024;

    public void zipExample() {
        String[] files = { "test1.txt", "test2.txt", "test3.txt" };
        byte[] buf = new byte[MAX_SIZE];

        ZipOutputStream outputStream = null;
        FileInputStream fileInputStream = null;
        try {
            outputStream = new ZipOutputStream(
                    new FileOutputStream("result.zip"));

            for (String file : files) {
                fileInputStream = new FileInputStream(file);
                outputStream.putNextEntry(new ZipEntry(file));

                int length = 0;
                while (((length = fileInputStream.read(buf)) > 0)) {
                    outputStream.write(buf, 0, length);
                }
                outputStream.closeEntry();
                fileInputStream.close();
            }
            outputStream.close();
        } catch (IOException e) {
            // Exception Handling
        } finally {
            try {
                outputStream.closeEntry();
                outputStream.close();
                fileInputStream.close();
            } catch (IOException e) {
                // Exception Handling
            }
        }
    }

    public static void main(String[] args) {
        new MadPlay().zipExample();
    }
}
```

The above example is code that compresses test1~3.txt files. Declare the path of the compressed file and create an OutPutStream object.
Also, after specifying the file path and creating FileInputStream, put files into ZipEntry objects.

As a result, it compresses files included in OutputStream's Entry and outputs the result.

If you want to delete target files after compression is complete, when creating the FileInputStream object,
create a File object as a constructor parameter, and after compression-related code ends, delete it with the `delete()` method.

<br>

# File Decompression Example
Examining code that decompresses, conversely:

```java
import java.io.IOException;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Java file decompression example
 *
 * @author Kimtaeng
 * Created on 2018. 1. 3
 */
public class MadPlay {
    private final int MAX_SIZE = 1024;

    public void unzipExample() {

        FileInputStream fileInputStream = null;
        FileOutputStream fileOutputStream = null;
        ZipInputStream zipInputStream = null;
        try {
            fileInputStream = new FileInputStream("result.zip");
            zipInputStream = new ZipInputStream(fileInputStream);
            ZipEntry zipEntry = null;

            while ((zipEntry = zipInputStream.getNextEntry()) != null) {
                fileOutputStream = new FileOutputStream(zipEntry.getName());

                int length = 0;
                byte[] buf = new byte[MAX_SIZE];
                while ((length = zipInputStream.read(buf)) != -1) {
                    fileOutputStream.write(buf, 0, length);
                }

                zipInputStream.closeEntry();
                fileOutputStream.flush();
                fileOutputStream.close();
            }
            zipInputStream.close();
        } catch (IOException e) {
            // Exception Handling
        } finally {
            try {
                zipInputStream.closeEntry();
                fileOutputStream.flush();
                fileOutputStream.close();
                zipInputStream.close();
            } catch (IOException e) {
                // Exception Handling
            }
        }
    }

    public static void main(String[] args) {
        new MadPlay().unzipExample();
    }
}
```

Each file included in the compressed zip is returned as a ZipEntry object, and using this object's `getName()` method,
you can know the file name before compression. The rest of the code is the opposite concept of the code in the compression example above.
