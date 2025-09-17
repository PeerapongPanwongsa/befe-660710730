package main

import (
	"fmt"
	"os"
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	host := getEnv("DB_HOST", "")
	// 	fmt.Println(host)
	name := getEnv("DB_NAME", "")
	// fmt.Println(name)
	user := getEnv("DB_USER", "")
	// fmt.Println(user)
	password := getEnv("DB_PASSWORD", "")
	// fmt.Println(password)
	port := getEnv("DB_PORT", "")
	// fmt.Println(port)

	conSt := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s ", host, port, user, password, name)
	fmt.Println(conSt)
	// Example of directly getting an environment variable
	// value := os.Getenv("DB_HOST")
	// fmt.Println(value)

}
