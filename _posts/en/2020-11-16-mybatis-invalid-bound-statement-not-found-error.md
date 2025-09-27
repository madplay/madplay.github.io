---
layout:   post
title:    "MyBatis Error: Invalid bound statement (not found)"
author:   Kimtaeng
tags:     mybatis
description: "What if 'Invalid bound statement (not found)' occurs when executing a MyBatis query?"
category: MyBatis
date: "2020-11-16 23:19:04"
comments: true
slug:     mybatis-invalid-bound-statement-not-found-error
lang:     en
permalink: /en/post/mybatis-invalid-bound-statement-not-found-error
---

# You can encounter this very often.
This post covers how to resolve
**org.apache.ibatis.binding.BindingException: Invalid bound statement (not found)**,
a common issue when using MyBatis.

Go through the checks one by one and review your project configuration.

<br>

# Why does it happen?
> If you found other cases beyond the list below, share in comments so others can benefit.

## Typos between Mapper interface and XML
First, check for typos in Mapper interface and XML.

There may be typos in `<select>` `id`, or `id` may differ from Mapper interface method names.
Mismatch between interface name and XML declaration can also cause this issue.

There are also cases with hidden whitespace that IDEs do not show clearly, like below.

```xml
<!-- whitespace exists in id -->
<select id="select " resultTYpe="String">
    ...
</select>
```

<br>

## mapper-locations
This can occur when mapper XML path is missing or incorrectly declared in `application.properties`.
Adjust exact path for your project.

```properties
mybatis.mapper-locations:classpath:mapper/*.xml
```

<br>

## Same mapper name, different package path
This happens when mapper names are the same but package names differ,
and IntelliJ/Eclipse shows no compile errors.
In this case, startup can still look normal, so manual verification is necessary.

<br>

## Typo in yaml file
You may use `yaml` instead of `properties` for configuration.
YAML is often more readable due to hierarchy,
but indentation mistakes are common when unfamiliar.

For example, `mybatis` should be at top level, not under top-level `spring`.
Wrong indentation can prevent correct loading of settings.

<br>

## DataSource Configuration
You also need to inspect DataSource-related configuration classes.

If `SessionFactory` is configured, mapper XML locations are usually set via `setMapperLocations`.
Verify it matches intent.
If `@MapperScan` is used, verify package path matches mapper interface location.
