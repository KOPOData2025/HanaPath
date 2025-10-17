# Spring Boot 애플리케이션을 위한 멀티 스테이지 빌드
FROM gradle:8.5-jdk17-alpine AS build

WORKDIR /app

# Gradle 설정 파일 복사
COPY build.gradle settings.gradle ./
COPY gradle gradle

# 의존성 다운로드
RUN gradle dependencies --no-daemon || true

# 소스 코드 복사
COPY src src

# 애플리케이션 빌드
RUN gradle bootJar --no-daemon -x test

# 실행 단계
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 보안을 위한 사용자 생성
RUN addgroup -g 1001 -S spring && \
    adduser -u 1001 -S spring -G spring

# 헬스 체크를 위한 curl 설치
RUN apk add --no-cache curl

# 빌드 단계에서 JAR 파일 복사
COPY --from=build /app/build/libs/*.jar app.jar

# 파일 소유권 변경
RUN chown -R spring:spring /app

USER spring

# 헬스 체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", \
    "app.jar"]

