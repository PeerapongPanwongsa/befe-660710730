/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bookstore-primary': '#2d5a4d',
        'bookstore-secondary': '#5fe9bc',
        // ✅ เพิ่ม Viridian เข้าไป เพื่อให้ Hero Section แสดงผลสีเขียว
        'viridian': { 
          100: '#E6F0EE', // ใช้สำหรับพื้นหลังอ่อน
          600: '#40826D', // สีหลักที่ใช้ใน component
          700: '#2D5A4D', // สีเข้มสำหรับ hover
          900: '#1A332B'
        },
      },
      fontFamily: {
        'sans': ['Prompt', 'sans-serif'],
      }
    },
  },
  plugins: [],
}