package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	_ "week11-assignment/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	_ "github.com/swaggo/swag"
)

type ErrorResponse struct {
	Message string `json:"message"`
}

var db *sql.DB

const bookFields = "id, title, author, isbn, year, price, category, original_price, discount, cover_image, rating, reviews_count, is_new, pages, language, publisher, description, created_at, updated_at"

type Book struct {
	ID     int     `json:"id"`
	Title  string  `json:"title"`
	Author string  `json:"author"`
	ISBN   string  `json:"isbn"`
	Year   int     `json:"year"`
	Price  float64 `json:"price"`

	// ฟิลด์ใหม่
	Category      string   `json:"category"`
	OriginalPrice *float64 `json:"original_price,omitempty"`
	Discount      int      `json:"discount"`
	CoverImage    string   `json:"cover_image"`
	Rating        float64  `json:"rating"`
	ReviewsCount  int      `json:"reviews_count"`
	IsNew         bool     `json:"is_new"`
	Pages         *int     `json:"pages,omitempty"`
	Language      string   `json:"language"`
	Publisher     string   `json:"publisher"`
	Description   string   `json:"description"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func initDB() {
	var err error
	host := getEnv("DB_HOST", "localhost")
	name := getEnv("DB_NAME", "bookstore")
	user := getEnv("DB_USER", "bookstore_user")
	password := getEnv("DB_PASSWORD", "your_strong_password")
	port := getEnv("DB_PORT", "5432")

	conSt := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, name)

	db, err = sql.Open("postgres", conSt)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	//กำหนดจำนวน Connection สูงสุด
	db.SetMaxOpenConns(25)

	// กำหนดจำนวน Idle connection สูงสุด
	db.SetMaxIdleConns(20)

	// กำหนดอายุของ Connection
	db.SetConnMaxLifetime(5 * time.Minute)

	err = db.Ping()
	if err != nil {
		log.Fatalf("Failed to Ping database: %v", err)
	}

	log.Println("Successfully connected to the database.")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getHealth(c *gin.Context) {
	err := db.Ping()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"message": "Unhealthy", "error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "healthy"})
}

// **เพิ่ม: ฟังก์ชัน Scan Row เพื่อรองรับ 19 คอลัมน์และค่า NULL**
func scanBookRow(rows *sql.Rows) (Book, error) {
	var book Book
	// ใช้ sql.Null types สำหรับ fields ที่อาจเป็น NULL
	var originalPrice sql.NullFloat64
	var pages sql.NullInt32

	err := rows.Scan(
		&book.ID, &book.Title, &book.Author, &book.ISBN, &book.Year, &book.Price,
		&book.Category, &originalPrice, &book.Discount, &book.CoverImage,
		&book.Rating, &book.ReviewsCount, &book.IsNew, &pages,
		&book.Language, &book.Publisher, &book.Description,
		&book.CreatedAt, &book.UpdatedAt,
	)

	// แปลง sql.Null กลับไปเป็น Go pointer
	if originalPrice.Valid {
		book.OriginalPrice = &originalPrice.Float64
	}
	if pages.Valid {
		pageInt := int(pages.Int32)
		book.Pages = &pageInt
	}

	return book, err
}

// **ส่วนที่ 3: Handlers (ปรับปรุงและเพิ่ม)**
func getBook(c *gin.Context) {
	id := c.Param("id")

	// **ปรับปรุง: SELECT fields ทั้งหมด 19 คอลัมน์**
	row := db.QueryRow(fmt.Sprintf("SELECT %s FROM books WHERE id = $1", bookFields), id)

	var book Book
	var originalPrice sql.NullFloat64
	var pages sql.NullInt32

	err := row.Scan(
		&book.ID, &book.Title, &book.Author, &book.ISBN, &book.Year, &book.Price,
		&book.Category, &originalPrice, &book.Discount, &book.CoverImage,
		&book.Rating, &book.ReviewsCount, &book.IsNew, &pages,
		&book.Language, &book.Publisher, &book.Description,
		&book.CreatedAt, &book.UpdatedAt,
	)

	// แปลง sql.Null กลับไปเป็น Go pointer
	if originalPrice.Valid {
		book.OriginalPrice = &originalPrice.Float64
	}
	if pages.Valid {
		pageInt := int(pages.Int32)
		book.Pages = &pageInt
	}

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, book)
}

// @Summary     Get all books
// @Description Get all books or filter by year or category
// @Tags        Books
// @Accept      json
// @Produce     json
// @Param       year     query    int     false  "Filter by publication year"
// @Param       category query    string  false  "Filter by book category"
// @Success     200  {array}  Book
// @Failure     500  {object}  ErrorResponse
// @Router      /books [get]
func getAllBooks(c *gin.Context) {
	YearQ := c.Query("year")
	CategoryQ := c.Query("category")

	query := fmt.Sprintf("SELECT %s FROM books", bookFields)
	var args []interface{}
	whereClauses := []string{}

	// Filter by year
	if YearQ != "" {
		if _, err := strconv.Atoi(YearQ); err == nil {
			args = append(args, YearQ)
			whereClauses = append(whereClauses, fmt.Sprintf("year = $%d", len(args)))
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year format"})
			return
		}
	}

	// Filter by category
	if CategoryQ != "" {
		args = append(args, CategoryQ)
		whereClauses = append(whereClauses, fmt.Sprintf("category ILIKE $%d", len(args)))
	}

	// Construct WHERE clause
	if len(whereClauses) > 0 {
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	query += " ORDER BY id ASC"

	rows, err := db.Query(query, args...)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		book, err := scanBookRow(rows)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"Error": err.Error()})
			return
		}
		books = append(books, book)
	}
	if books == nil {
		books = []Book{}
	}
	c.JSON(http.StatusOK, books)
}

// @Summary Get unique categories
// @Description Retrieve a list of all unique book categories available.
// @Tags Books
// @Accept json
// @Produce json
// @Success 200 {array} string "List of unique categories"
// @Failure 500 {object} ErrorResponse
// @Router /categories [get]
func getCategories(c *gin.Context) {
	rows, err := db.Query("SELECT DISTINCT category FROM books WHERE category IS NOT NULL AND category != '' ORDER BY category ASC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var categories []string
	for rows.Next() {
		var category string
		if err := rows.Scan(&category); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		categories = append(categories, category)
	}

	c.JSON(http.StatusOK, categories)
}

// @Summary Search books by keyword
// @Description Search books by matching keywords in title or author.
// @Tags Books
// @Accept json
// @Produce json
// @Param q query string true "Search keyword (e.g., 'art', 'lean')"
// @Success 200 {array} Book
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /books/search [get]
func searchBooks(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query 'q' is required"})
		return
	}

	searchTerm := "%" + strings.ToLower(query) + "%"

	sqlQuery := fmt.Sprintf(`
		SELECT %s FROM books 
		WHERE LOWER(title) LIKE $1 OR LOWER(author) LIKE $1
		ORDER BY rating DESC
	`, bookFields) // **ปรับปรุง: SELECT fields ทั้งหมด**

	rows, err := db.Query(sqlQuery, searchTerm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		// **ปรับปรุง: ใช้ scanBookRow**
		book, err := scanBookRow(rows)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"Error": err.Error()})
			return
		}
		books = append(books, book)
	}
	if books == nil {
		books = []Book{}
	}
	c.JSON(http.StatusOK, books)
}

// @Summary Get featured books
// @Description Get top-rated books, ordered by rating and reviews count.
// @Tags Books
// @Accept json
// @Produce json
// @Success 200 {array} Book
// @Failure 500 {object} ErrorResponse
// @Router /books/featured [get]
func getFeaturedBooks(c *gin.Context) {
	rows, err := db.Query(fmt.Sprintf(`
		SELECT %s FROM books 
		ORDER BY rating DESC, reviews_count DESC 
		LIMIT 10
	`, bookFields)) // **ปรับปรุง: SELECT fields ทั้งหมด**

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		// **ปรับปรุง: ใช้ scanBookRow**
		book, err := scanBookRow(rows)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"Error": err.Error()})
			return
		}
		books = append(books, book)
	}
	if books == nil {
		books = []Book{}
	}
	c.JSON(http.StatusOK, books)
}

// @Summary Get discounted books
// @Description Get books that currently have a discount applied (discount > 0).
// @Tags Books
// @Accept json
// @Produce json
// @Success 200 {array} Book
// @Failure 500 {object} ErrorResponse
// @Router /books/discounted [get]
func getDiscountedBooks(c *gin.Context) {
	rows, err := db.Query(fmt.Sprintf(`
		SELECT %s FROM books 
		WHERE discount > 0 
		ORDER BY discount DESC
	`, bookFields))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		book, err := scanBookRow(rows)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"Error": err.Error()})
			return
		}
		books = append(books, book)
	}
	if books == nil {
		books = []Book{}
	}
	c.JSON(http.StatusOK, books)
}

// @Summary     Get new books
// @Description Get latest books ordered by created date
// @Tags        Books
// @Accept      json
// @Produce     json
// @Param       limit  query    int  false  "Number of books to return (default 5)"
// @Success     200   {array}   Book
// @Failure     500   {object}  ErrorResponse
// @Router      /books/new [get]
func getNewBooks(c *gin.Context) { // **ปรับปรุง: Handler เดิม (เป็น 5. GET /books/new)**
	limit := c.DefaultQuery("limit", "5")

	rows, err := db.Query(fmt.Sprintf(`
		SELECT %s FROM books 
		ORDER BY created_at DESC 
		LIMIT $1
	`, bookFields), limit) // **ปรับปรุง: SELECT fields ทั้งหมด**

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		book, err := scanBookRow(rows)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		books = append(books, book)
	}

	if books == nil {
		books = []Book{}
	}

	c.JSON(http.StatusOK, books)
}

// @Summary Create a new book
// @Description Create a new book
// @Tags Books
// @Produce  json
// @Param book body Book true "Book object to be created"
// @Success 201  {object}  Book
// @Failure 400  {object}  ErrorResponse
// @Failure 500  {object}  ErrorResponse
// @Router  /books [post]
func createBook(c *gin.Context) { // **ปรับปรุง: Handler นี้ต้องรองรับ 19 คอลัมน์ในการ Insert**
	var newBook Book

	if err := c.ShouldBindJSON(&newBook); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var id int
	var created_At, updated_At time.Time

	// **ปรับปรุง: เพิ่มฟิลด์ใหม่ทั้งหมดในการ INSERT**
	err := db.QueryRow(
		`INSERT INTO books (title, author, isbn, year, price, category, original_price, discount, cover_image, rating, reviews_count, is_new, pages, language, publisher, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING id, created_at, updated_at`,
		newBook.Title, newBook.Author, newBook.ISBN, newBook.Year, newBook.Price,
		newBook.Category, newBook.OriginalPrice, newBook.Discount, newBook.CoverImage, newBook.Rating, newBook.ReviewsCount, newBook.IsNew,
		newBook.Pages, newBook.Language, newBook.Publisher, newBook.Description,
	).Scan(&id, &created_At, &updated_At)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	newBook.ID = id
	newBook.CreatedAt = created_At
	newBook.UpdatedAt = updated_At

	c.JSON(http.StatusCreated, newBook)
}

// @Summary     Update a book
// @Description Update book details by ID
// @Tags        Books
// @Accept      json
// @Produce     json
// @Param       id    path      int   true  "Book ID"
// @Param       book  body      Book  true  "Book object"
// @Success     200  {object}   Book
// @Failure     400  {object}   ErrorResponse
// @Failure     404  {object}   ErrorResponse
// @Failure     500  {object}   ErrorResponse
// @Router      /books/{id} [put]
func updateBook(c *gin.Context) {
	id := c.Param("id")
	var updateBook Book

	if err := c.ShouldBindJSON(&updateBook); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var ID int
	var updatedAt time.Time

	setClauses := []string{
		"title = $1", "author = $2", "isbn = $3", "year = $4", "price = $5",
		"category = $6", "original_price = $7", "discount = $8", "cover_image = $9",
		"rating = $10", "reviews_count = $11", "is_new = $12", "pages = $13",
		"language = $14", "publisher = $15", "description = $16",
	}

	// Prepare arguments for UPDATE
	args := []interface{}{
		updateBook.Title, updateBook.Author, updateBook.ISBN, updateBook.Year, updateBook.Price,
		updateBook.Category, updateBook.OriginalPrice, updateBook.Discount, updateBook.CoverImage,
		updateBook.Rating, updateBook.ReviewsCount, updateBook.IsNew, updateBook.Pages,
		updateBook.Language, updateBook.Publisher, updateBook.Description,
	}

	// Add the ID for the WHERE clause (it's the last argument)
	args = append(args, id)

	err := db.QueryRow(
		fmt.Sprintf(`
         UPDATE books
         SET %s
         WHERE id = $%d
         RETURNING id, updated_at`,
			strings.Join(setClauses, ", "), len(args)),
		args...,
	).Scan(&ID, &updatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	updateBook.ID = ID
	updateBook.UpdatedAt = updatedAt
	c.JSON(http.StatusOK, updateBook)
}

// @Summary     Delete a book
// @Description Delete book by ID
// @Tags        Books
// @Accept      json
// @Produce     json
// @Param       id   path      int     true  "Book ID"
// @Success     200  {object}  map[string]interface{}
// @Failure     404  {object}  ErrorResponse
// @Failure     500  {object}  ErrorResponse
// @Router      /books/{id} [delete]
func deleteBook(c *gin.Context) {
	id := c.Param("id")

	result, err := db.Exec("DELETE FROM books WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error message": err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error message": err.Error()})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found!!!"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "book deleted successfully"})
}

// @title           Bookstore API with Advanced Features
// @version         1.1
// @description     This API now supports advanced filtering, search, and specialized endpoints.
// @host            localhost:8088
// @BasePath        /api/v1
func main() {
	initDB()
	defer db.Close()

	r := gin.Default()
	r.GET("/health", getHealth)
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	r.Use(cors.New(config))
	r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := r.Group("/api/v1")
	{
		api.GET("/books", getAllBooks)

		api.GET("/books/:id", getBook)
		api.POST("/books", createBook)
		api.PUT("/books/:id", updateBook)
		api.DELETE("/books/:id", deleteBook)
		api.GET("/categories", getCategories)            //1
		api.GET("/books/search", searchBooks)            //2
		api.GET("/books/featured", getFeaturedBooks)     //3
		api.GET("/books/new", getNewBooks)               //4
		api.GET("/books/discounted", getDiscountedBooks) //5
	}

	r.Run(":8080")
}

//http://localhost:8080/docs/index.html
