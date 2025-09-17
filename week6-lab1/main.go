package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Student struct represents a student record.
type Student struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Email string  `json:"email"`
	Year  int     `json:"year"`
	GPA   float64 `json:"gpa"`
}

// In-memory database
var students = []Student{
	{ID: "1", Name: "John Doe", Email: "john@example.com", Year: 3, GPA: 3.50},
	{ID: "2", Name: "Jane Smith", Email: "jane@example.com", Year: 2, GPA: 3.75},
}

// GET /api/v1/students
func getStudents(c *gin.Context) {
	yearQuery := c.Query("year")

	if yearQuery != "" {
		var filteredStudents []Student
		for _, student := range students {
			if fmt.Sprint(student.Year) == yearQuery {
				filteredStudents = append(filteredStudents, student)
			}
		}
		c.JSON(http.StatusOK, filteredStudents)
		return
	}
	c.JSON(http.StatusOK, students)
}

// GET /api/v1/students/:id
func getStudent(c *gin.Context) {
	id := c.Param("id")

	for _, student := range students {
		if student.ID == id {
			c.JSON(http.StatusOK, student)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{
		"error": "Student not found",
	})
}

// POST /api/v1/students
func createStudent(c *gin.Context) {
	var newStudent Student
	if err := c.ShouldBindJSON(&newStudent); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if newStudent.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	if newStudent.Year < 1 || newStudent.Year > 4 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "year must be 1-4"})
		return
	}

	newStudent.ID = fmt.Sprintf("%d", len(students)+1)
	students = append(students, newStudent)
	c.JSON(http.StatusCreated, newStudent)
}

// PUT /api/v1/students/:id
func updateStudent(c *gin.Context) {
	id := c.Param("id")
	var updatedStudent Student

	if err := c.ShouldBindJSON(&updatedStudent); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for i, student := range students {
		if student.ID == id {
			updatedStudent.ID = id
			students[i] = updatedStudent
			c.JSON(http.StatusOK, updatedStudent)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
}

// DELETE /api/v1/students/:id
func deleteStudent(c *gin.Context) {
	id := c.Param("id")

	for i, student := range students {
		if student.ID == id {
			students = append(students[:i], students[i+1:]...)
			c.JSON(http.StatusOK, gin.H{
				"message": "Student deleted successfully",
			})
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
}

func main() {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "healthy"})
	})

	api := r.Group("/api/v1")
	{
		api.GET("/students", getStudents)
		api.GET("/students/:id", getStudent)
		api.POST("/students", createStudent)
		api.PUT("/students/:id", updateStudent)
		api.DELETE("/students/:id", deleteStudent)
	}

	r.Run(":8080")
}

// curl http://localhost:8080/health
// curl http://localhost:8080/api/v1/students
// curl http://localhost:8080/api/student/1
