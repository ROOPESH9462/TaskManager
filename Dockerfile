FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY lib/ /app/lib/
COPY src/ /app/src/
RUN mkdir bin && javac -d bin -cp "lib/*" src/com/taskmaster/*.java
EXPOSE 8080
CMD ["java", "-cp", "bin:lib/*", "com.taskmaster.TaskServer"]
