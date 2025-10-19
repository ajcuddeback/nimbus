# Backend multi-stage Dockerfile for Spring Boot
FROM gradle:9-jdk21 AS build
WORKDIR /src
# Copy Gradle wrapper and build files first for caching
COPY build.gradle settings.gradle gradle.* ./
COPY gradlew ./
COPY gradle ./gradle
RUN chmod +x ./gradlew || true

# Copy the rest of the project
COPY src ./src
COPY --chown=gradle:gradle . /src

# Build the bootJar
RUN ./gradlew bootJar --no-daemon -x test

# Run stage: use a small JRE image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy jar from build stage
COPY --from=build /src/build/libs/*.jar app.jar

ENV JAVA_OPTS="-Xms128m -Xmx512m"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
