import { BookOpenIcon, LogoutIcon } from '@heroicons/react/outline';
import { useEffect, useState } from 'react';
// 💥 เพิ่ม useParams เพื่อดึง ID เมื่ออยู่ในโหมดแก้ไข
import { useNavigate, useParams } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8080/api/v1/books';

const AddBookPage = () => {
  // 💥 ดึง id จาก URL (จะมีค่าเมื่ออยู่ในโหมดแก้ไข)
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 💥 ตรวจสอบโหมดปัจจุบัน
  const isEditMode = !!id; 

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    year: '',
    price: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingBook, setLoadingBook] = useState(isEditMode); // ถ้า Edit ให้เริ่มที่ Loading
  const [submitMessage, setSubmitMessage] = useState('');
  const [errorLoading, setErrorLoading] = useState(null);

  // ----------------------------------------------------------------
  // 💥 [EFFECT] ดึงข้อมูลหนังสือเมื่ออยู่ในโหมดแก้ไข
  // ----------------------------------------------------------------
  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem('isAdminAuthenticated');
    if (!isAuthenticated) {
      navigate('/login');
    }

    if (isEditMode) {
      const fetchBookData = async () => {
        try {
          setLoadingBook(true);
          const response = await fetch(`${API_BASE_URL}/${id}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch book data for editing');
          }
          
          const data = await response.json();
          
          // กำหนดค่าเริ่มต้นของฟอร์มด้วยข้อมูลที่ดึงมา
          setFormData({
            title: data.title || '',
            author: data.author || '',
            isbn: data.isbn || '',
            // แปลงตัวเลขกลับเป็น string สำหรับ field input type="number"
            year: data.year ? String(data.year) : '', 
            price: data.price ? String(data.price) : ''
          });
          setErrorLoading(null);

        } catch (err) {
          setErrorLoading(err.message);
          console.error('Error fetching book for edit:', err);
        } finally {
          setLoadingBook(false);
        }
      };
      fetchBookData();
    }
  }, [navigate, id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    // ... (Logic Validation เดิม) ...
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'กรุณากรอกชื่อหนังสือ';
    } else if (formData.title.length < 2) {
      newErrors.title = 'ชื่อหนังสือต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    // Author validation
    if (!formData.author.trim()) {
      newErrors.author = 'กรุณากรอกชื่อผู้แต่ง';
    } else if (formData.author.length < 2) {
      newErrors.author = 'ชื่อผู้แต่งต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    // ISBN validation
    if (!formData.isbn.trim()) {
      newErrors.isbn = 'กรุณากรอก ISBN';
    } else if (!/^[0-9-]+$/.test(formData.isbn)) {
      newErrors.isbn = 'ISBN ต้องเป็นตัวเลขและเครื่องหมาย - เท่านั้น';
    }

    // Year validation
    if (!formData.year) {
      newErrors.year = 'กรุณากรอกปีที่ตีพิมพ์';
    } else {
      const yearNum = parseInt(formData.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum)) {
        newErrors.year = 'ปีต้องเป็นตัวเลขเท่านั้น';
      } else if (yearNum < 1000 || yearNum > currentYear + 1) {
        newErrors.year = `ปีต้องอยู่ระหว่าง 1000 ถึง ${currentYear + 1}`;
      }
    }

    // Price validation
    if (!formData.price) {
      newErrors.price = 'กรุณากรอกราคา';
    } else {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum)) {
        newErrors.price = 'ราคาต้องเป็นตัวเลขเท่านั้น';
      } else if (priceNum <= 0) {
        newErrors.price = 'ราคาต้องมากกว่า 0';
      } else if (priceNum > 999999) {
        newErrors.price = 'ราคาต้องไม่เกิน 999,999 บาท';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ----------------------------------------------------------------
  // 💥 [FUNCTION] Logic Submit: POST (Add) หรือ PUT (Edit)
  // ----------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // 💥 กำหนด Method และ URL ตามโหมด
    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode ? `${API_BASE_URL}/${id}` : API_BASE_URL;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // ส่งข้อมูลที่ถูกแปลงประเภทข้อมูลแล้ว
          title: formData.title.trim(),
          author: formData.author.trim(),
          isbn: formData.isbn.trim(),
          year: parseInt(formData.year),
          price: parseFloat(formData.price)
        }),
      });

      if (!response.ok) {
        // พยายามอ่าน error message จาก backend
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Failed to process book');
      }

      const action = isEditMode ? 'แก้ไข' : 'เพิ่ม';
      setSubmitMessage(`ดำเนินการ ${action} หนังสือ "${formData.title}" สำเร็จ!`);

      // 💥 หลังทำสำเร็จ: Redirect ไปหน้า All Books ของ Store Manager
      setTimeout(() => {
        navigate('/store-manager/all-books');
      }, 1500);

    } catch (error) {
      setErrors({ submit: `เกิดข้อผิดพลาดในการ ${isEditMode ? 'แก้ไข' : 'เพิ่ม'} หนังสือ: ` + error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    navigate('/login');
  };
  
  // ----------------------------------------------------------------
  // 💥 [RENDER] Loading และ Error ในโหมด Edit
  // ----------------------------------------------------------------
  if (loadingBook) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-xl">Loading book data...</div>
        </div>
      );
  }

  if (errorLoading) {
      return (
          <div className="flex flex-col justify-center items-center min-h-screen">
              <div className="text-xl text-red-600 mb-4">Error loading book: {errorLoading}</div>
              <button onClick={() => navigate('/store-manager/all-books')} className="text-blue-600 hover:underline">
                  Go back to Manager List
              </button>
          </div>
      );
  }

  // ----------------------------------------------------------------
  // 💥 [RENDER] JSX หลัก
  // ----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header (เหมือนเดิม) */}
      <header className="bg-gradient-to-r from-viridian-600 to-green-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <BookOpenIcon className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold">BookStore - BackOffice</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30
                rounded-lg transition-colors"
            >
              <LogoutIcon className="h-5 w-5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {/* 💥 เปลี่ยน Title ตามโหมด */}
              {isEditMode ? `แก้ไขหนังสือ ID: ${id}` : 'เพิ่มหนังสือใหม่'}
            </h2>

            {submitMessage && (
              <div className="mb-6 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                {submitMessage}
              </div>
            )}

            {errors.submit && (
              <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ... (Form Fields เดิม) ... */}
              
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อหนังสือ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                    ${errors.title
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-viridian-500'}`}
                  placeholder="กรอกชื่อหนังสือ"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Author */}
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้แต่ง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                    ${errors.author
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-viridian-500'}`}
                  placeholder="กรอกชื่อผู้แต่ง"
                />
                {errors.author && (
                  <p className="mt-1 text-sm text-red-600">{errors.author}</p>
                )}
              </div>

              {/* ISBN */}
              <div>
                <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="isbn"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                    ${errors.isbn
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-viridian-500'}`}
                  placeholder="กรอก ISBN (ตัวอย่าง: 978-3-16-148410-0)"
                />
                {errors.isbn && (
                  <p className="mt-1 text-sm text-red-600">{errors.isbn}</p>
                )}
              </div>

              {/* Year and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Year */}
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                    ปีที่ตีพิมพ์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                      ${errors.year
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-viridian-500'}`}
                    placeholder="เช่น 2024"
                  />
                  {errors.year && (
                    <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    ราคา (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                      ${errors.price
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-viridian-500'}`}
                    placeholder="เช่น 350.00"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white
                    transition-colors duration-200
                    ${isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-viridian-600 hover:bg-viridian-700'}`}
                >
                  {isSubmitting 
                    ? `กำลังบันทึก...` 
                    : isEditMode 
                      ? 'บันทึกการแก้ไข' 
                      : 'เพิ่มหนังสือ'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/store-manager/all-books')}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold
                    text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBookPage; // ยังคงใช้ชื่อเดิมตามไฟล์ของคุณ