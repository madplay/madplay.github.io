---
layout:   post
title:    Java Kafka Producer, Consumer 예제 구현
author:   Kimtaeng
tags: 	  java kafka 
description: Java를 이용하여 Kafka Producer와 Kakfa Consumer를 구현해보자. 
category: Java
comments: true
---

# Getting Started With Kafka!
Kafka Producer와 Consumer를 자바로 직접 구현하는 것은 생각보다 간단합니다.
하지만 코드를 실행하여 결과까지 확인하기 위해서는 아래와 같이 Kafka 설치 과정이 필요합니다.
kafka는 zookeeper와 같이 움직입니다. 그렇기 때문에 zookeeper 설치도 필요합니다.

### kafka & zookeeper 설치하기
```bash
brew install kafka
brew install zookeeper
zkServer start # zookeeper running
kafka-server-start /usr/local/etc/kafka/server.properties # kafka running
```

### kafka topic 생성하기
```bash
# replication-factor : 복제본 개수(1)
# partitions : 파티션 개수(1)
# topic : 토픽명(taeng)
$ kafka-topics --create --zookeeper localhost:2181 \ 
      --replication-factor 1 --partitions 1 --topic taeng
```

일단 카프카를 코드로 구현할 준비는 모두 끝났습니다. 다만 간단한 예제를 살펴보기 위한 최소한의 준비입니다.
실제 실무에서는 지금과 같이 단일 시스템으로 사용하지는 않습니다.
그리고 본격적인 구현에 앞서! 이번 포스팅에서는 kafka나 zookeeper에 대한 이론적인 부분은 자세히 다루지 않습니다.

<br>

# 구현해보자! Kafka Producer
예제는 간단합니다. 단순하게 키보드 입력을 받아 전송하는 것이지요.
실무에서는 kafka 전송에 있어서 연결을 끊거나 유지하는 것이 엄격하게 관리되겠지만
지금은 간단한 예제인만큼 단순하게 특정 메시지를 입력하면 연결이 종료되도록 합시다.

```java
/**
 * Kafka Producer.
 * keyboard input을 통해 메시지를 전송한다.
 *
 * @author Kimtaeng
 * Created on 2018. 9. 10.
 */
public class MyKafkaProducer {
    private static final String TOPIC_NAME = "taeng";
    private static final String FIN_MESSAGE = "exit";

    public static void main(String[] args) {
        Properties properties = new Properties();
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());

        KafkaProducer<String, String> producer = new KafkaProducer<>(properties);

        while(true) {
            Scanner sc = new Scanner(System.in);
            System.out.print("Input > ");
            String message = sc.nextLine();

            ProducerRecord<String, String> record = new ProducerRecord<>(TOPIC_NAME, message);
            try {
                producer.send(record, (metadata, exception) -> {
                    if (exception != null) {
                        // some exception
                    }
                });

            } catch (Exception e) {
                // exception
            } finally {
                producer.flush();
            }

            if(StringUtils.equals(message, FIN_MESSAGE)) {
                producer.close();
                break;
            }
        }
    }
}
```


<br>

# 구현해보자! Kafka Consumer
Consumer의 경우는 구독(subscribe)을 시작한 후 poll을 통해 레코드를 처리합니다.
topic의 경우에 List로 설정 가능합니다. 단일 topic이 아니라는 것이지요.
poll 메서드의 파라미터는 레코드를 기다릴 최대 블럭 시간입니다.
그리고 앞서 살펴본 Producer와 동일하게 특정 메시지를 받으면 종료하게 됩니다.

```java
/**
 * Kafka Consumer.
 * Producer가 전송한 메시지를 받는다.
 *
 * @author Kimtaeng
 * Created on 2018. 9. 10.
 */
public class MyKafkaConsumer {
    private static final String TOPIC_NAME = "taeng";
    private static final String FIN_MESSAGE = "exit";

    public static void main(String[] args) {
        Properties properties = new Properties();
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        properties.put(ConsumerConfig.GROUP_ID_CONFIG, TOPIC_NAME);

        KafkaConsumer<String, String> consumer = new KafkaConsumer<>(properties);
        consumer.subscribe(Collections.singletonList(TOPIC_NAME));

        String message = null;
        try {
            do {
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100000));

                for (ConsumerRecord<String, String> record : records) {
                    message = record.value();
                    System.out.println(message);
                }
            } while (!StringUtils.equals(message, FIN_MESSAGE));
        } catch(Exception e) {
            // exception
        } finally {
            consumer.close();
        }
    }
}
```

<br>

# 실행해보자!
먼저 Consumer를 미리 실행한 후에 Producer를 실행해야 합니다.
Producer를 실행한 후 키보드 입력으로 메시지를 입력하면 Consumer의 콘솔 화면에서 전송된 메시지를 확인할 수 있습니다. 

<img class="post_image" width="560" alt="kafka producer"
src="{{ site.baseurl }}/img/post/2018-09-10-java-kafka-example-1.png"/>

<img class="post_image" width="560" alt="kafka consumer"
src="{{ site.baseurl }}/img/post/2018-09-10-java-kafka-example-2.png"/>

자바로 Kafka Producer와 Consumer를 간단하게 구현하고 실행해보았습니다.
위의 예제 코드에서 살펴본 것 외에도 더 많은 옵션 설정이 있는데요. 이 설정들은 이어지는 글을 통해서 알아봅시다.

- <a href="/post/kafka-producer-consumer-options" target="_blank">다음 글: Java Kafka Producer, Consumer configs 설정</a> 