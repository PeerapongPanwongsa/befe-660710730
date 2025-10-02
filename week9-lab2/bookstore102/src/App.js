import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotFound from './components/NotFound';

// Pages
import HomePage from './pages/HomePage';
import BookListPage from './pages/BookListPage';
import BookDetailPage from './pages/BookDetailPage';
import CategoryPage from './pages/CategoryPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

function App() {
  return (
    <Router>
      {/* ✅ เพิ่ม text-gray-800 เพื่อบังคับให้สีข้อความเป็นสีเข้มในทุกส่วน */}
      <div className="flex flex-col min-h-screen text-gray-800"> 
        <Navbar />
        
        <main className="flex-grow bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/books" element={<BookListPage />} />
            <Route path="/books/:id" element={<BookDetailPage />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/categories/:category" element={<CategoryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;