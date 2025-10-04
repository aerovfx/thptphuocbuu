"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Comprehensive translation keys
const translations = {
  vi: {
    // Admin Dashboard
    'admin.dashboard': 'Bảng điều khiển',
    'admin.users': 'Người dùng',
    'admin.courses': 'Khóa học',
    'admin.quiz': 'Quiz',
    'admin.assignments': 'Bài tập',
    'admin.video': 'Video',
    'admin.learning-path': 'Lộ trình học',
    'admin.live-chat': 'Live Chat',
    'admin.competition': 'Cuộc thi',
    'admin.stem': 'STEM Projects',
    'admin.calendar': 'Calendar',
    
    // Admin Dashboard Stats
    'admin.total-users': 'Tổng người dùng',
    'admin.total-courses': 'Khóa học',
    'admin.revenue': 'Doanh thu',
    'admin.active-modules': 'Module đang hoạt động',
    'admin.system-status': 'Trạng thái hệ thống',
    'admin.system-healthy': 'Hệ thống hoạt động tốt',
    'admin.system-warning': 'Cảnh báo hệ thống',
    'admin.system-critical': 'Hệ thống có vấn đề',
    'admin.published': 'đã xuất bản',
    'admin.draft': 'bản nháp',
    'admin.courses-sold': 'khóa học đã bán',
    'admin.from-students': 'từ {count} học sinh',
    
    // Teacher Dashboard
    'teacher.dashboard': 'Bảng điều khiển',
    'teacher.students': 'Học sinh',
    'teacher.courses': 'Khóa học',
    'teacher.assignments': 'Bài tập',
    'teacher.content': 'Nội dung',
    'teacher.quizzes': 'Quiz',
    'teacher.pending-grading': 'Chờ chấm điểm',
    'teacher.average-rating': 'Đánh giá trung bình',
    'teacher.new-this-month': 'mới trong tháng',
    'teacher.assignments-to-grade': 'Bài tập cần chấm',
    'teacher.all-courses': 'Tất cả khóa học',
    'teacher.from-students': 'Từ {count} học sinh',
    
    // Common
    'common.total': 'Tổng',
    'common.active': 'Hoạt động',
    'common.published': 'Đã xuất bản',
    'common.draft': 'Bản nháp',
    'common.revenue': 'Doanh thu',
    'common.rating': 'Đánh giá',
    'common.users': 'Người dùng',
    'common.students': 'Học sinh',
    'common.teachers': 'Giáo viên',
    'common.courses': 'Khóa học',
    'common.quizzes': 'Quiz',
    'common.assignments': 'Bài tập',
    'common.videos': 'Video',
    'common.sign-out': 'Đăng xuất',
    'common.language': 'Ngôn ngữ',
    'common.quantity': 'Số lượng',
    'common.type': 'Loại',
    'common.current': 'Hiện có',
    'common.items': 'mục',
    'common.paths': 'đường dẫn',
    'common.chats': 'cuộc trò chuyện',
    'common.competitions': 'cuộc thi',
    'common.projects': 'dự án',
    'common.events': 'sự kiện',
  },
  en: {
    // Admin Dashboard
    'admin.dashboard': 'Dashboard',
    'admin.users': 'Users',
    'admin.courses': 'Courses',
    'admin.quiz': 'Quiz',
    'admin.assignments': 'Assignments',
    'admin.video': 'Video',
    'admin.learning-path': 'Learning Path',
    'admin.live-chat': 'Live Chat',
    'admin.competition': 'Competition',
    'admin.stem': 'STEM Projects',
    'admin.calendar': 'Calendar',
    
    // Admin Dashboard Stats
    'admin.total-users': 'Total Users',
    'admin.total-courses': 'Courses',
    'admin.revenue': 'Revenue',
    'admin.active-modules': 'Active Modules',
    'admin.system-status': 'System Status',
    'admin.system-healthy': 'System Healthy',
    'admin.system-warning': 'System Warning',
    'admin.system-critical': 'System Critical',
    'admin.published': 'published',
    'admin.draft': 'draft',
    'admin.courses-sold': 'courses sold',
    'admin.from-students': 'from {count} students',
    
    // Teacher Dashboard
    'teacher.dashboard': 'Dashboard',
    'teacher.students': 'Students',
    'teacher.courses': 'Courses',
    'teacher.assignments': 'Assignments',
    'teacher.content': 'Content',
    'teacher.quizzes': 'Quizzes',
    'teacher.pending-grading': 'Pending Grading',
    'teacher.average-rating': 'Average Rating',
    'teacher.new-this-month': 'new this month',
    'teacher.assignments-to-grade': 'Assignments to grade',
    'teacher.all-courses': 'All courses',
    'teacher.from-students': 'From {count} students',
    
    // Common
    'common.total': 'Total',
    'common.active': 'Active',
    'common.published': 'Published',
    'common.draft': 'Draft',
    'common.revenue': 'Revenue',
    'common.rating': 'Rating',
    'common.users': 'Users',
    'common.students': 'Students',
    'common.teachers': 'Teachers',
    'common.courses': 'Courses',
    'common.quizzes': 'Quizzes',
    'common.assignments': 'Assignments',
    'common.videos': 'Videos',
    'common.sign-out': 'Sign Out',
    'common.language': 'Language',
    'common.quantity': 'Quantity',
    'common.type': 'Type',
    'common.current': 'Current',
    'common.items': 'items',
    'common.paths': 'paths',
    'common.chats': 'chats',
    'common.competitions': 'competitions',
    'common.projects': 'projects',
    'common.events': 'events',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('vi');

  useEffect(() => {
    // Load language from localStorage
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'vi' || savedLanguage === 'en')) {
        setLanguage(savedLanguage);
      }
    }
  }, []);

  useEffect(() => {
    // Save language to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'vi' ? 'en' : 'vi');
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key as keyof typeof translations[typeof language]] || key;
    
    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}