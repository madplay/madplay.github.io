---
layout:   post
title:    자바 암호화와 복호화
author:   Kimtaeng
tags: 	  java encrypting decrypting
description: 자바에서 암호화와 복호화는 어떻게 구현할까? 암호화에 사용되는 알고리즘, 운용 방식, 패딩이란 무엇일까?
category: Java
date: "2020-12-02 21:23:11"
comments: true
---

# 자바의 보안 관련 API
자바는 JCA(Java Cryptography Architecture)와 JCE(Java Cryptography Extension)를 기반으로 오래전부터 보안 관련 기능을
제공해왔다. 이를 통해 암호학에 대한 깊은 지식이 없어도 간편하게 보안 관련 기능을 적용할 수 있다.

이번 글에서는 자바에서 제공하는 보안 관련된 기능을 살펴보고 어떻게 암호화와 복호화를 구현하는지 살펴본다.

<br>

# Java Cryptography Architecture
JCA(Java Cryptography Architecture)는 JDK 1.1부터 제공된 암호화 기능을 담은 보안 관련 핵심 프레임워크다.
전자서명(digital signatures), 메시지를 해시하는 메시지 다이제스트(message digests), 인증서(certificates)와 인증서 유효성 검사,
암호화 및 복호화, 키 생성과 관리 API를 포함한다.

JCA는 `java.security` 패키지를 통해 제공되며 주요 클래스로는 `MessageDigest`, `Signature`,  `SecureRandom` 등이 있다. 
또한 Sun, SunRsaSign, SunJCE와 같이 실제 암호화 구현 내용을 담은 공급자(provider)를 포함한다.

JCA는 다음 원칙을 중심으로 설계되었다.

### 구현 독립성(Implementation independence)
애플리케이션에서 보안 관련 알고리즘을 구현할 필요가 없으며, 오히려 자바 플랫폼을 통해 보안 관련 서비스를 호출해
사용할 수 있다. 이러한 기능은 표준 인터페이스를 통해 자바 플랫폼에 연결되는 공급자(provider)를 통해 구현되며
보안 기능을 위해서 독립적인 여러 공급자를 사용할 수 있다.

### 구현 상호운용성(Implementation interoperability)
공급자(provider)는 애플리케이션 간에 상호 운용이 가능하다. 애플리케이션이 특정 공급자에 종속되지 않으며,
공급자도 마찬가지로 특정 애플리케이션에 종속되지 않는다.

즉, 다양한 구현체가 서로 잘 동작하거나 서로의 키(key)를 사용하거나 또는 서로의 서명을 확인할 수 있음을 의미한다.
예를 들어 같은 알고리즘이라면, 어떤 공급자가 생성한 키를 다른 공급자가 사용할 수 있고 생성한 서명 또한 다른 공급자가
확인할 수 있다.

### 알고리즘 확장성(Algorithm extensibility)
자바 플랫폼에는 대중적으로 사용되는 보안 서비스를 구현한 공급자(provider)를 포함한다. 
하지만 아직 미구현된 새로운 표준 서비스 같은 경우는 사용자가 간단하게 직접 추가할 수 있다.

<br>

# Java Cryptography Extension
JCE(Java Cryptography Extension)는 앞서 살펴본 JCA를 보다 더 확장한 기능을 담고 있다. 미국에서 보안상의 이유로
2000년 이후부터 해외에 공급되었고 JDK 1.4부터 기본적으로 포함되었다.

JCE에서 제공하는 기능들은 `javax.crypto` 패키지에 포함되며 주요 클래스는 `Cipher`, `KeyGenerator`, `SecretKey` 등이 있다.

자바에는 썬(Sun)에서 만든 JCA 구현체인 SunJCE가 기본적으로 내장되어 있지만, 더 많은 기능을 제공하는 `BouncyCastle`
라이브러리도 많이 사용한다. 사용에 있어서 특별한 제약도 없다.

<br>

# 주요 클래스와 기능
## Provider
앞서 살펴본 JCA의 설계 원칙인 구현 독립성(Implementation independence)은 공급자 기반(provider based) 아키텍처를 사용하기 때문에 가능하다.
여기서 말하는 공급자, 즉 암호화 서비스 공급자(Cryptographic Service Providers)는 전자서명 알고리즘, 키 변환 서비스 등과 같이 하나 이상의
암호화 서비스를 구현하는 패키지를 뜻한다.

각 암호화 서비스 공급자는 공급자의 이름을 갖고 있으며 구현한 모든 보안 서비스와 알고리즘이 나열된 클래스의 인스턴스를 포함한다. 
특정 알고리즘의 인스턴스가 필요할 때, JCA 프레임워크는 공급자의 데이터베이스를 참조하여 인스턴스를 생성한다.

따라서 자바 프로그램에서는 어떤 알고리즘을 요청할 때, 아래와 같이 특정 공급자에게 구현체를 요청할 수 있다.

```java
md = MessageDigest.getInstance("SHA-256");
md = MessageDigest.getInstance("SHA-256", "ProviderC"); // 예시
```

아래 그림을 통해 살펴보자. 해시 알고리즘인 "SHA-256" 메시지 다이제스트 구현을 요청하는 모습이다. "SHA-256", "SHA-384",
"SHA-512"을 구현하는 세 개의 다른 공급자(provider)가 있다. 공급자는 선호도에 따라 왼쪽에서 오른쪽으로 정렬된다.

첫 번째 그림을 살펴보면, 공급자의 이름을 지정하지 않고 SHA-256 알고리즘 구현을 요청했다. 공급자는 우선순위에 따라서
검색이 되며, 입력한 SHA-256 알고리즘을 제공하는 첫 번째 공급자인 ProviderB의 구현이 반환된다.

두 번째 그림은, SHA-256 알고리즘 구현을 특정 공급자인 ProviderC에게 요청한다. 더 높은 우선순위를 가진 ProviderB 공급자가
SHA-256 알고리즘 구현을 제공할 수 있더라도 지정한 공급자인 ProviderC의 알고리즘 구현이 반횐된다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-12-02-encryption-and-decryption-in-java-1.png"
width="800" alt="sha-256 message digest implementation"/>

JDK의 암호화 구현은 히스토리를 위해 주로 여러 다른 공급자를 통해 배포되지만, 제공하는 기능이나 알고리즘의 유형에 따라서
배포되지는 않는다. 또한 Java 실행 환경에 따라서 특정 공급자가 포함되지 않은 상황도 있을 수 있기 때문에 특정 공급자를
지정해서 알고리즘 구현을 요청하는 것을 권장하지 않는다.

JCA는 설치된 공급자와 지원하는 서비스를 확인할 수 있는 방법들을 제공하며 쉽게 공급자를 추가할 수 있다. 또한 third-party
구현체도 가능하다. 이러한 기능은 `Provider` 클래스를 이용하면 된다.

## Cipher
`javax.crypto.Cipher` 클래스는 암호화 알고리즘을 나타낸다. 암호를 사용하여 데이터를 암호화하거나 복호화할 수 있다.
아래와 같이 암호화 알고리즘, 운용 방식 그리고 패딩 방식을 전달해 `Cipher` 인스턴스를 만들 수 있다.

```java
Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
```

위의 예제 코드에서 전달한 파라미터에 대해서 간단히 알아보자. 각각 순서대로 암호화 알고리즘, 운용 방식 그리고 패딩 방식을
나타낸다.

### 암호화 알고리즘
암호화에 사용되는 알고리즘을 말한다. 암호화 알고리즘은 크게 단방향 알고리즘과 양방향 알고리즘으로 나눌 수 있으며
양방향 알고리즘은 대칭키 방식과 비대칭키 방식으로 구분할 수 있다.

**단방향 알고리즘**의 경우 평문을 암호문으로 암호화할 수 있지만, 반대로 암호문을 평문으로 되돌리는 복호화는 불가능하다.
보통 해시(Hash) 기법을 사용하며 SHA-256, MD-5등이 있다.

**비대칭키 알고리즘**은 암호화와 복호화에 사용되는 키가 서로 다르다. 두 개의 키 중에서 하나는 반드시 공개되어야 사용이
가능하기 때문에 공개키 방식이라고도 한다. 대표적으로는 RSA가 있다. 

**대칭키 알고리즘**은 암호화할 때 사용되는 키와 복호화할 때 사용되는 키가 동일한 암호화 방법을 말한다.
가장 보편적으로 사용되는 알고리즘으로 AES가 있다.

### 운용 방식
암호학에서 특정 비트 수의 집합을 한꺼번에, 그러니까 일정 크기의 블록 단위로 구성하여 처리하는 암호 기법을
블록 암호(block cipher)라고 한다.

- <a href="/post/introduction-to-cryptography-and-types-of-ciphers#블록-암호와-스트림-암호">참고: "암호 기법: 치환 암호, 전치 암호, 블록 암호, 스트림 암호"</a>

블록 암호는 특정한 길이의 블록 단위로 동작하기 때문에, 가변적인 길이 데이터를 암호화하기 위해서는 먼저 데이터를 나누어야 한다.
그리고 이 블록을 어떻게 암호화할지 정해야 하는데, 이때 블록들의 암호화 방식을 운용 방식(modes of operation)이라고 한다.

아래는 위의 코드에서 사용한 CBC(Cipher Block Chaining) 운용 방식이다. CBC 모드를 사용한 암호화 과정에서는 원문의 각 블록은
암호화되기 전에 이전 암호문 블록과 XOR 연산되는 방식이다. 따라서 같은 내용의 원문 블록이어도 다른 암호문을 갖는다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-12-02-encryption-and-decryption-in-java-2.png"
width="800" alt="cipher block chaining (CBC) mode encryption"/>

여기서 **초기화 벡터(Initialization Vector)**라는 용어가 등장한다. 최초의 평문 블록을 암호화할 때 직전의 암호문 블록이
없기 때문에 이를 대체할 블록이 필요한데, 이를 초기화 벡터라고 하며 영문자 앞 글자만 따서 `IV`로도 표기한다.

### 패딩
AES나 DES와 같은 블록 암호 알고리즘은 평문의 길이가 해당 암호의 블록 크기(DES는 8바이트, AES는 16바이트)의 배수로
정확하게 떨어져야 한다. 그렇지 않은 경우 가장 마지막 블록은 정해진 블록 크기보다 작은 크기로 구성된다.
이때, 마지막 블록의 빈 공간을 채우는 것을 패딩이라고 한다. 물론 특정 바이트의 배수여도 패딩 방식은 추가해야 한다.

대표적으로 8바이트로 고정된 PKCS5와 가변 크기의 PKCS7 등이 있으며 각각 DES와 AES 알고리즘에 사용한다.

위의 `Cipher` 객체를 얻어오는 코드를 다시 봐보자. AES 알고리즘을 사용했는데 PKCS5 패딩 방식을 적용한 것을 보고 혼동이 될 수 있다.
자바 프로그래밍에서 패딩 방식을 입력할 때는 PKCS5와 PKCS7을 구분하지 않고 `PKCS5Paddig`로 입력한다.
내부적으로 가변 크기인 PKCS7 패딩 방식으로 동작하지만, 네이밍이 PKCS5로 되있다.

따라서 위의 예제에서 16바이트를 블록 크기로 사용하는 AES 알고리즘에 `PKCS7Padding`를 입력해도 오류가 발생하지 않는다.
오히려 명시적으로 `PKCS7Padding`를 입력하게 되는 경우 매핑되는 방식이 없어 `NoSuchAlgorithmException` 예외가 발생한다.

## KeyGenerator
데이터를 암호화하거나 복호화 하려면 키가 필요하다. 앞서 살펴본 것처럼 사용하는 알고리즘의 유형에 따라서 대칭키와
비대칭 키가 존재한다. 자바에서는 `javax.crypto.KeyGenerator` 클래스를 이용하면 암호화에 필요한 키를 생성할 수 있다.

```java
SecretKey secretKey = KeyGenerator.getInstance("AES").generateKey();
```

키의 크기만 지정하거나, 키의 크기와 더불어 `SecureRandom` 클래스를 이용하여 랜덤한 키도 생성할 수 있으다.
또한 공급자(provider)에 독립적인 방식으로 직접 키를 지정할 수도 있다.

```java
// 키의 크기와 난수 지정
KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
SecureRandom secureRandom = new SecureRandom();
keyGenerator.init(128, secureRandom);
SecretKey secretKey = keyGenerator.generateKey();

// 직접 지정
SecretKeySpec key = new SecretKeySpec("MyKey".getBytes("UTF-8"), "AES");
```

생성한 키는 `Cipher` 클래스 객체의 `init` 메서드의 인자로 전달되어 `Cipher` 객체를 초기화하는데 사용한다.

<br>

# 암호화 및 복호화 예제
이제 앞서 살펴본 내용들을 기반으로 자바에서 암호화 및 복호화를 하는 방법을 자바 코드로 구현해보자.
예제는 특정 애플리케이션에 종속적이지 않도록 유틸리티성 클래스 형태로 구현해볼 예정이기 때문에 인스턴스 생성 없이
접근할 수 있도록 `static` 메서드로 구현한다.

암호화 알고리즘은 `AES`를 사용하므로 아래와 같이 초기화 벡터(Initialization Vector)에 대한 코드 정의도 필요하다.

```java
public AESCryptoUtil {

    /**
     * 키 반환
     */
    public static SecretKey getKey() throws Exception {
        KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
        keyGenerator.init(128);
        SecretKey secretKey = keyGenerator.generateKey();
        return secretKey;
    }
	
    /**
     * 초기화 벡터 반환
     */
    public static IvParameterSpec getIv() {
        byte[] iv = new byte[16];
        new SecureRandom().nextBytes(iv);
        return new IvParameterSpec(iv);
    }
    
    // 이어지는 암호화 및 복호화 예제 코드 
}
```

## 문자열 암호화와 복호화
자바에서 문자열을 암호화하고 복호화 해보자. 먼저, 키와 초기화 벡터를 생성하고 `Cipher.getInstance` 메서드로
`Cipher` 클래스의 인스턴스를 생성해야 한다.

그리고 앞서 만든 키와 초기화 벡터로 Cipher 인스턴스를 초기화시키는 과정이 필요하다. 마지막으로 `doFinal` 메서드를
호출해서 문자열을 암호화하면 된다.

`Cipher`를 초기화할 때 사용되는 파라미터 값은 암호화, 복호화에 따라서 다르므로 유의하자.
암호화를 할 때는 `Cipher.ENCRYPT_MODE`이며, 복호화를 할 떄는 `Cipher.DECRYPT_MODE`를 전달해야 한다.

```java
public class AESCryptoUtil {
	
	// ... getKey, getIv 메서드는 생략
	
	public static String encrypt(String specName, SecretKey key, IvParameterSpec iv,
		String plainText) throws Exception {
		Cipher cipher = Cipher.getInstance(specName);
		cipher.init(Cipher.ENCRYPT_MODE, key, iv);
		byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
		return new String(Base64.getEncoder().encode(encrypted));
	}

	public static String decrypt(String specName, SecretKey key, IvParameterSpec iv,
		String cipherText) throws Exception {
		Cipher cipher = Cipher.getInstance(specName);
		cipher.init(Cipher.DECRYPT_MODE, key, iv); // 모드가 다르다.
		byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(cipherText));
		return new String(decrypted, StandardCharsets.UTF_8);
	}
}
```

테스트는 아래 코드로 진행할 수 있다.

```java
String plainText = "Hello, MadPlay!";

SecretKey key = AESCryptoUtil.getKey();
IvParameterSpec ivParameterSpec = AESCryptoUtil.getIv();
String specName = "AES/CBC/PKCS5Padding";

String encryptedText = AESCryptoUtil.encrypt(specName, key, ivParameterSpec, plainText);
String decryptedText = AESCryptoUtil.decrypt(specName, key, ivParameterSpec, encryptedText);

System.out.println("cipherText: " + encryptedText);
System.out.println("plainText: " + decryptedText);
```

위 테스트 코드의 출력 결과는 아래와 같다.

```bash
cipherText: vzyKxKufZmKdtSUwVKWJYg==
plainText: Hello, MadPlay!
```

## 파일 암호화와 복호화
다음으로 파일 암호화와 복호화를 해보자. 앞서 살펴본 문자열 암호화와 거치는 단계는 동일하지만, 파일 작업을 위한
입출력 클래스들이 필요하다.

```java
public static void encryptFile(String specName, SecretKey key, IvParameterSpec iv,
        File inputFile, File outputFile) throws Exception {
	
    Cipher cipher = Cipher.getInstance(specName);
    cipher.init(Cipher.ENCRYPT_MODE, key, iv);
    
    try (FileOutputStream output = new FileOutputStream(outputFile);
        CipherOutputStream cipherOutput = new CipherOutputStream(output, cipher)) {
    
        String data = Files.lines(inputFile.toPath()).collect(Collectors.joining("\n"));
	    cipherOutput.write(data.getBytes(StandardCharsets.UTF_8));
    }
}

public static void decryptFile(String specName, SecretKey key, IvParameterSpec iv,
        File encryptedFile, File decryptedFile) throws Exception {
	
    Cipher cipher = Cipher.getInstance(specName);
    cipher.init(Cipher.DECRYPT_MODE, key, iv);

    try (
        CipherInputStream cipherInput = new CipherInputStream(new FileInputStream(encryptedFile), cipher);
        InputStreamReader inputStream = new InputStreamReader(cipherInput);
        BufferedReader reader = new BufferedReader(inputStream);
        FileOutputStream fileOutput = new FileOutputStream(decryptedFile)) {

        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
	    fileOutput.write(sb.toString().getBytes(StandardCharsets.UTF_8));
    }
}
```

테스트는 아래 코드로 해볼 수 있다. 실행 결과로 입력에 사용된 파일과 복호화된 파일의 내용을 표준 출력으로 보여준다.


```java
SecretKey key = AESCryptoUtil.getKey();
String specName = "AES/CBC/PKCS5Padding";
IvParameterSpec ivParameterSpec = AESCryptoUtil.getIv();

File inputFile = Paths.get("input.txt").toFile();
File encryptedFile = new File("encrypted.txt");
File decryptedFile = new File("decrypted.txt");
AESCryptoUtil.encryptFile(specName, key, ivParameterSpec, inputFile, encryptedFile);
AESCryptoUtil.decryptFile(specName, key, ivParameterSpec, encryptedFile, decryptedFile);

// 결과 확인용
String inputText = Files.lines(Paths.get("input.txt"), StandardCharsets.UTF_8)
    .collect(Collectors.joining("\n"));
String encryptedText = Files.lines(Paths.get("decrypted.txt"), StandardCharsets.UTF_8)
    .collect(Collectors.joining("\n"));

System.out.println("input: " + inputText);
System.out.println("decrypted: " + encryptedText);
```

<br>

# 마치며
지금까지 자바에서 제공하는 보안 관련 기능에 대해서 알아보았다. 처음 자바의 보안 관련 API를 알게 되었을 때,
이해가 되지 않는 부분이 많았다. 특히 파라미터로 넘기는 값들은 도대체 무엇을 의미하는지, 패딩은 무엇인지 등
대부분의 기능을 모르고 사용했던 것 같다.

그래서 이번 글에서는 단순히 자바 암호화 및 복호화 코드 예제를 소개하는 것보다는 필자와 비슷한 경험을 할 사람들을 위해
암호화 알고리즘이나 운용 방식 그리고 패딩과 같은 암호학에 대한 간단한 지식도 덧붙였다.

하지만 관련 내용을 공부하면서도 느낀 것이 이 글에서 소개한 내용은 컴퓨터 암호학에 대한 빙산의 일각일 뿐이라는 것이다. 
암호학에 관한 더 자세한 지식은 관련 전문 문서를 참고해야 할 것 같다. 

> 이번 글에서 사용한 이미지의 일부는 오라클 문서(Oracle docs)에서 인용했습니다.
> 자바에서 제공하는 보안 관련 API의 전반적인 설명도 아래 링크를 참조하시면 됩니다.

- <a href="https://docs.oracle.com/javase/8/docs/technotes/guides/security/crypto/CryptoSpec.html" target="_blank" rel="nofollow">
참조 링크: "Oracle docs: CryptoSpec"</a>