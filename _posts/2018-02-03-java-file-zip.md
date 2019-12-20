---
layout:   post
title:    자바 파일 압축과 압축 해제(ZipInputStream, ZipOutputStream)
author:   Kimtaeng
tags: 	  Java ZipOutputStream
description: java.util.zip 패키지를 이용한 자바 파일 압축과 압축 해제
category: Java
date: "2018-02-03 21:31:29"
comments: true
---

# 자바에서의 파일 압축과 해제
Java 언어에서도 기본적으로 파일 압축과 해제에 대한 기능을 제공한다.
`java.util.zip` 패키지를 이용하면 우리가 흔하게 사용하고 있는 zip 확장자 파일을 다룰 수 있다.

이 패키지에는 스트림을 zip이나 gzip 확장자 파일로 압축하거나 반대로 압축을 해제하는 필터 스트림이 존재하는데
이를 이용하여 압축된 데이터를 네트워크를 통해서 교환하는 자바 프로그램을 개발할 수 있다.

<br>

# 파일 압축 예제
스트림을 이용해 파일을 압축하는 코드를 살펴보자.

```java
import java.io.IOException;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * 자바 파일 압축 예제
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
                while (((length = fileInputStream.read()) > 0)) {
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

위 예제는 test1~3.txt 파일을 압축하는 코드이다. 압축된 파일의 경로를 선언하고 OutPutStream 객체를 생성한다.
또한, 파일의 경로 지정과 FileInputStream을 생성한 후 ZipEntry 객체로 파일들을 집어넣는다.

결과적으로는 OutputStream의 Entry에 포함된 파일들을 압축해서 결과를 출력하게 된다.

압축을 완료한 후에 압축 대상 파일들을 삭제하고 싶다면 FileInputStream 객체 생성 시에
생성자 파라미터로 File 객체를 생성한 후에 압축 관련 코드가 끝난 후 `delete()` 메서드로 삭제하면 된다.

<br>

# 파일 압축 해제 예제
반대로 압축을 해제하는 코드를 살펴보자.

```java
import java.io.IOException;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * 자바 파일 압축 해제 예제
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
                while ((length = zipInputStream.read()) != -1) {
                    fileOutputStream.write(length);
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

압축된 zip에 포함된 각 파일들은 ZipEntry 라는 객체로 반환되고, 이 객체의 `getName()` 메서드를 사용하면
압축 이전의 파일 이름을 알 수 있게 된다. 나머지 코드들은 위에서 살펴본 압축 예제에서의 코드들과 반대되는 개념이다.
