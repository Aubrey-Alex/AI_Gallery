# backend/Dockerfile

# 1. 编译阶段
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src

# 跳过测试打包，加快速度
RUN mvn clean package -DskipTests

# 2. 运行阶段

FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# 从上一阶段拷贝打好的 jar 包
COPY --from=build /app/target/*.jar app.jar

# 暴露 8080 端口
EXPOSE 8080

# 启动命令
ENTRYPOINT ["java", "-jar", "app.jar"]