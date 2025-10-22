import { PencilIcon, TrashIcon } from '@heroicons/react/outline';
import { useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

// Endpoint API
const API_BASE_URL = 'http://localhost:8080/api/v1/books'; 

const StoreManagerAllBooksPage = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ----------------------------------------------------------------
    // 1. Logic ดึงข้อมูล (GET)
    // ----------------------------------------------------------------
    const fetchBooks = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_BASE_URL);

            if (!response.ok) {
                throw new Error('Failed to fetch books');
            }
            const data = await response.json();
            setBooks(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching books:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    // ----------------------------------------------------------------
    // 2. Logic การลบข้อมูล (DELETE)
    // ----------------------------------------------------------------
    const handleDelete = async (bookId) => {
        // ยืนยันก่อนลบ
        if (!window.confirm(`ยืนยันการลบหนังสือ ID: ${bookId}? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${bookId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete book');
            }

            // อัปเดต UI โดยการกรองหนังสือที่ถูกลบออก (ไม่ต้องโหลดใหม่ทั้งหมด)
            setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
            alert('ลบหนังสือสำเร็จ');
        } catch (err) {
            console.error('Error deleting book:', err);
            alert(`เกิดข้อผิดพลาดในการลบ: ${err.message}`);
        }
    };

    // ----------------------------------------------------------------
    // 3. Logic การแก้ไข (นำทางไปยังหน้า Edit)
    // ----------------------------------------------------------------
    const handleEdit = (bookId) => {
        // นำทางไปยังหน้าแก้ไขหนังสือ (ต้องมี Route สำหรับหน้านี้ด้วย!)
        navigate(`/store-manager/edit-book/${bookId}`);
    };

    const handleNavigateAddBook = () => {
        navigate('/store-manager/add-book');
    };

    if (loading) {
        return <LoadingSpinner />;
    }
    
    // ----------------------------------------------------------------
    // 4. ส่วนแสดงผล (JSX) เป็นตาราง
    // ----------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                
                {/* 💥 แก้ไข: Header จัดวาง Title ซ้าย และปุ่มขวา */}
                <div className="mb-8 flex items-start justify-between">
                    <h1 className="text-4xl font-bold text-gray-900">จัดการหนังสือทั้งหมด (BackOffice)</h1>
                </div>
                
                {error && <p className="text-red-500 mb-4">Error: {error}</p>}

                <p className="text-gray-600 mb-4 text-lg">พบหนังสือ **{books.length} เล่ม**</p>

                {/* Book Table (เหมือนเดิม) */}
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price (฿)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {books.length > 0 ? (
                                books.map((book) => (
                                    <tr key={book.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 max-w-xs text-sm font-medium text-gray-900 truncate">{book.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.author}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.isbn}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{book.price}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    onClick={() => handleEdit(book.id)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                    title="แก้ไข"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(book.id)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                    title="ลบ"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">ไม่พบหนังสือในระบบจัดการ</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StoreManagerAllBooksPage;