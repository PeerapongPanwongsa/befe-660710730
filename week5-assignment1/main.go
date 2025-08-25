package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Book struct {
	ID     string  `json:"id"`
	Title  string  `json:"title"`
	Author string  `json:"author"`
	Price  float64 `json:"price"`
}

var books = []Book{
	{ID: "1", Title: "Go Programming", Author: "Alan Donovan", Price: 500.00},
	{ID: "2", Title: "Clean Code", Author: "Robert C. Martin", Price: 450.00},
	{ID: "3", Title: "The Pragmatic Programmer", Author: "Andrew Hunt", Price: 480.00},
	{ID: "4", Title: "Design Patterns", Author: "Erich Gamma", Price: 550.00},
	{ID: "5", Title: "Refactoring", Author: "Martin Fowler", Price: 520.00},
}

func getBooks(c *gin.Context) {
	idQuery := c.Query("id")

	if idQuery != "" {
		filter := []Book{}
		for _, book := range books {
			if fmt.Sprint(book.ID) == idQuery {
				filter = append(filter, book)
			}
		}
		c.JSON(http.StatusOK, filter)
		return
	}

	c.JSON(http.StatusOK, books)
}

func main() {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "healthy"})
	})

	api := r.Group("/api/v1")
	{
		api.GET("/books", getBooks)
	}

	r.Run(":8080")
}
