import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCard from '../components/BookCard';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';

// **** แก้ไข: ลบ import { PencilIcon, TrashIcon } ออก ****

const AllBooksPage = () => {
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [sortBy, setSortBy] = useState('newest');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const booksPerPage = 12;

    const categories = [
        'all', 'fiction', 'non-fiction', 'science', 'history', 'art',
        'psychology', 'business', 'technology', 'cooking'
    ];
    const [error, setError] = useState(null);
    
    // ตั้งค่า URL ของ Backend
    const API_BASE_URL = 'http://localhost:8080/api/v1/books'; 

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true);

                // เรียก API เพื่อดึงข้อมูลหนังสือ
                const response = await fetch(API_BASE_URL);

                if (!response.ok) {
                    throw new Error('Failed to fetch books');
                }
                const data = await response.json();

                setBooks(data);         // เก็บข้อมูลทั้งหมดไว้ใน state books
                setFilteredBooks(data);
                setError(null);

            } catch (err) {
                setError(err.message);
                console.error('Error fetching books:', err);

            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, []);

    // **** ลบ: handleNavigateAddBook, handleEdit, handleDelete ออก เพราะเป็นหน้าลูกค้า ****
    const navigate = useNavigate();

    const handleSearch = (searchTerm) => {
        const filtered = books.filter(book =>
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredBooks(filtered);
        setCurrentPage(1);
    };

    const handleCategoryFilter = (category) => {
        setSelectedCategory(category);
        if (category === 'all') {
            setFilteredBooks(books);
        } else {
            const filtered = books.filter(book =>
                book.category && book.category.toLowerCase() === category.toLowerCase()
            );
            setFilteredBooks(filtered);
        }
        setCurrentPage(1);
    };

    const handleSort = (sortValue) => {
        setSortBy(sortValue);
        const sorted = [...filteredBooks];
        switch (sortValue) {
            case 'price-low':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'popular':
                // ตรวจสอบว่ามี reviews หรือไม่ก่อนเปรียบเทียบ
                sorted.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
                break;
            case 'newest':
            default:
                // จัดเรียงตาม ID เพื่อให้เหมือนใหม่ล่าสุด
                sorted.sort((a, b) => b.id - a.id); 
        }
        setFilteredBooks(sorted);
    };

    // Pagination logic
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
    const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // **** ลบ: handleEdit และ handleDelete ออกจาก AllBooksPage ****

    if (loading) {
        return <LoadingSpinner />;
    } 
    
    // หากเกิด Error จะแสดงข้อความ Error
    if (error) {
        return <div className="text-center py-12 text-red-600">
            <h2 className="text-2xl font-bold">เกิดข้อผิดพลาดในการดึงข้อมูล</h2>
            <p>{error}</p>
        </div>;
    }


    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Page Header - ลบปุ่ม Add Book ออก เพราะไม่ใช่หน้า Manager */}
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-4xl font-bold text-gray-900">หนังสือทั้งหมด</h1>
                    {/* ลบปุ่ม Add Book ออก */}
                </div>
                <p className="text-gray-600 mb-8">ค้นพบหนังสือที่คุณชื่นชอบจากคอลเล็กชันของเรา</p>


                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <SearchBar onSearch={handleSearch} />
                        </div>

                        {/* Category Filter */}
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none 
                focus:ring-2 focus:ring-viridian-500 cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => handleCategoryFilter(e.target.value)}
                        >
                            <option value="all">ทุกหมวดหมู่</option>
                            <option value="fiction">นิยาย</option>
                            <option value="non-fiction">สารคดี</option>
                            <option value="science">วิทยาศาสตร์</option>
                            <option value="history">ประวัติศาสตร์</option>
                            <option value="art">ศิลปะ</option>
                            <option value="psychology">จิตวิทยา</option>
                            <option value="business">ธุรกิจ</option>
                            <option value="technology">เทคโนโลยี</option>
                            <option value="cooking">อาหาร</option>
                        </select>

                        {/* Sort */}
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none 
                focus:ring-2 focus:ring-viridian-500 cursor-pointer"
                            value={sortBy}
                            onChange={(e) => handleSort(e.target.value)}
                        >
                            <option value="newest">ใหม่ล่าสุด</option>
                            <option value="price-low">ราคาต่ำ-สูง</option>
                            <option value="price-high">ราคาสูง-ต่ำ</option>
                            <option value="popular">ยอดนิยม</option>
                        </select>
                    </div>

                    {/* Results count */}
                    <div className="mt-4 text-sm text-gray-600">
                        พบหนังสือ {filteredBooks.length} เล่ม
                        {selectedCategory !== 'all' && ` ในหมวด ${selectedCategory}`}
                    </div>
                </div>

                {/* Books Grid */}
                {currentBooks.length > 0 ? (
                    // **** แก้ไข: ลบปุ่ม Edit/Delete ที่หุ้ม BookCard ออก ****
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {currentBooks.map(book => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">ไม่พบหนังสือที่ค้นหา</p>
                    </div>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-12 flex justify-center">
                        <nav className="flex items-center space-x-2">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg 
                  hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                ก่อนหน้า
                            </button>

                            {[...Array(totalPages)].map((_, index) => {
                                const pageNumber = index + 1;
                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => paginate(pageNumber)}
                                        className={`px-4 py-2 rounded-lg ${currentPage === pageNumber
                                            ? 'bg-viridian-600 text-white'
                                            : 'border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            })}


                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg 
                  hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                ถัดไป
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllBooksPage;