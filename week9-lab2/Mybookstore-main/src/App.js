import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Components
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import NotFound from './components/NotFound';

// Pages
import AboutPage from './pages/AboutPage';
import AddBookPage from './pages/AddBookPage';
import AllBooksPage from './pages/AllBooksPage';
import BookDetailPage from './pages/BookDetailPage';
import BookListPage from './pages/BookListPage';
import CategoryPage from './pages/CategoryPage';
import ContactPage from './pages/ContactPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
// 💥 Import Component ใหม่สำหรับ Store Manager
import StoreManagerAllBooksPage from './pages/StoreManagerAllBooksPage'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* หน้า Login แยก ไม่ต้องมี Navbar/Footer */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* <Route path="/store-manager/all-books" element={<StoreManagerAllBooksPage />} />
        <Route path="/store-manager/add-book" element={<AddBookPage />}/>
        <Route path="/store-manager/edit-book/:id" element={<AddBookPage />} />  */}

        {/* หน้าอื่นๆ ที่มี Navbar และ Footer */}
        <Route
          path="*"
          element={
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow bg-gray-50">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  {/* แนะนำให้ใช้ AllBooksPage ใน /books แทน BookListPage */}
                  <Route path="/books" element={<AllBooksPage />} /> 
                  <Route path="/books/:id" element={<BookDetailPage />} />
                  <Route path="/categories" element={<CategoryPage />} />
                  <Route path="/categories/:category" element={<CategoryPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />

                  <Route path="/store-manager/all-books" element={<StoreManagerAllBooksPage />} />
                  
                  <Route path="/store-manager/add-book" element={<AddBookPage />}/>
                  <Route path="/store-manager/edit-book/:id" element={<AddBookPage />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;