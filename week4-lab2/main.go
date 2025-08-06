package main

import (
	"fmt"
)

// var email string = "panwongsa_p@silpakorn.edu"

func main() {
	// var name string = "peerapong"
	var age int = 20

	email := "panwongsa_p@silpakorn.edu"
	gpa := 3.14

	firstname, lastname := "Peerapong", "Panwongsa"

	fmt.Printf("Name: %s %s, age %d, email %s, gpa %.2f\n", firstname, lastname, age, email, gpa)
}
