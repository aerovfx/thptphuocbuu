"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
  category: 'learning' | 'streak' | 'xp' | 'special';
}

interface XPData {
  totalXP: number;
  level: number;
  gems: number;
  hearts: number;
  streak: number;
  achievements: Achievement[];
  completedLessons: string[];
}

const XPContext = createContext<{
  xpData: XPData;
  addXP: (amount: number, source: string) => void;
  completeLesson: (lessonId: string, xpReward: number) => void;
  updateStreak: () => void;
  checkAchievements: () => void;
  newAchievements: Achievement[];
  clearNewAchievements: () => void;
} | null>(null);

const initialAchievements: Achievement[] = [
  {
    id: 'first_lesson',
    name: 'Bước đầu học tập',
    description: 'Hoàn thành bài học đầu tiên',
    icon: '🎓',
    xpReward: 50,
    category: 'learning'
  },
  {
    id: 'xp_100',
    name: 'Người học tích cực',
    description: 'Đạt được 100 XP',
    icon: '⭐',
    xpReward: 0,
    category: 'xp'
  },
  {
    id: 'xp_500',
    name: 'Học sinh giỏi',
    description: 'Đạt được 500 XP',
    icon: '🏆',
    xpReward: 0,
    category: 'xp'
  },
  {
    id: 'xp_1000',
    name: 'Học sinh xuất sắc',
    description: 'Đạt được 1000 XP',
    icon: '👑',
    xpReward: 0,
    category: 'xp'
  },
  {
    id: 'streak_3',
    name: 'Kiên trì',
    description: 'Học liên tục 3 ngày',
    icon: '🔥',
    xpReward: 100,
    category: 'streak'
  },
  {
    id: 'streak_7',
    name: 'Quyết tâm',
    description: 'Học liên tục 7 ngày',
    icon: '💪',
    xpReward: 300,
    category: 'streak'
  },
  {
    id: 'streak_30',
    name: 'Bất khuất',
    description: 'Học liên tục 30 ngày',
    icon: '🏅',
    xpReward: 1000,
    category: 'streak'
  },
  {
    id: 'level_5',
    name: 'Thăng cấp',
    description: 'Đạt cấp độ 5',
    icon: '📈',
    xpReward: 0,
    category: 'special'
  },
  {
    id: 'level_10',
    name: 'Chuyên gia',
    description: 'Đạt cấp độ 10',
    icon: '🎯',
    xpReward: 0,
    category: 'special'
  }
];

export const XPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const [xpData, setXpData] = useState<XPData>({
    totalXP: 0,
    level: 1,
    gems: 0,
    hearts: 5,
    streak: 0,
    achievements: [],
    completedLessons: []
  });
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // Get user-specific localStorage key
  const getStorageKey = () => {
    if (session?.user?.email) {
      return `xpData_${session.user.email}`;
    }
    return 'xpData';
  };

  // Load XP data from localStorage
  useEffect(() => {
    if (!session?.user?.email) return;
    
    try {
      const storageKey = getStorageKey();
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setXpData(parsed);
      } else {
        // Initialize with default data
        setXpData({
          totalXP: 0,
          level: 1,
          gems: 0,
          hearts: 5,
          streak: 0,
          achievements: [],
          completedLessons: []
        });
      }
    } catch (error) {
      console.error('Error loading XP data:', error);
    }
  }, [session?.user?.email]);

  // Save XP data to localStorage
  useEffect(() => {
    if (!session?.user?.email) return;
    
    try {
      const storageKey = getStorageKey();
      console.log('💾 XP Context: Saving to localStorage:', storageKey, xpData);
      localStorage.setItem(storageKey, JSON.stringify(xpData));
    } catch (error) {
      console.error('❌ Error saving XP data:', error);
    }
  }, [xpData, session?.user?.email]);

  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 100) + 1;
  };

  const addXP = (amount: number, source: string) => {
    setXpData(prev => {
      const newXP = prev.totalXP + amount;
      const newLevel = calculateLevel(newXP);
      const levelUp = newLevel > prev.level;
      
      return {
        ...prev,
        totalXP: newXP,
        level: newLevel,
        gems: prev.gems + (levelUp ? newLevel * 10 : 0) + Math.floor(amount / 10)
      };
    });
    
    checkAchievements();
  };

  const completeLesson = (lessonId: string, xpReward: number) => {
    console.log('🎮 XP Context: completeLesson called with:', lessonId, xpReward);
    
    setXpData(prev => {
      console.log('🎮 XP Context: Previous completed lessons:', prev.completedLessons);
      
      if (prev.completedLessons.includes(lessonId)) {
        console.log('🎮 XP Context: Lesson already completed, skipping');
        return prev; // Already completed
      }
      
      const newXP = prev.totalXP + xpReward;
      const newLevel = calculateLevel(newXP);
      const levelUp = newLevel > prev.level;
      
      const newData = {
        ...prev,
        totalXP: newXP,
        level: newLevel,
        gems: prev.gems + (levelUp ? newLevel * 10 : 0) + Math.floor(xpReward / 10),
        completedLessons: [...prev.completedLessons, lessonId]
      };
      
      console.log('🎮 XP Context: New XP data:', newData);
      return newData;
    });
    
    checkAchievements();
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastStreakDate = localStorage.getItem(`lastStreakDate_${session?.user?.email || 'guest'}`);
    
    if (lastStreakDate !== today) {
      setXpData(prev => {
        const newStreak = lastStreakDate === new Date(Date.now() - 86400000).toDateString() 
          ? prev.streak + 1 
          : 1;
        
        localStorage.setItem(`lastStreakDate_${session?.user?.email || 'guest'}`, today);
        
        return {
          ...prev,
          streak: newStreak
        };
      });
      
      checkAchievements();
    }
  };

  const checkAchievements = () => {
    setXpData(prev => {
      const newAchievements = [...prev.achievements];
      
      initialAchievements.forEach(achievement => {
        if (!newAchievements.find(a => a.id === achievement.id)) {
          let shouldUnlock = false;
          
          switch (achievement.id) {
            case 'first_lesson':
              shouldUnlock = prev.completedLessons.length >= 1;
              break;
            case 'xp_100':
              shouldUnlock = prev.totalXP >= 100;
              break;
            case 'xp_500':
              shouldUnlock = prev.totalXP >= 500;
              break;
            case 'xp_1000':
              shouldUnlock = prev.totalXP >= 1000;
              break;
            case 'streak_3':
              shouldUnlock = prev.streak >= 3;
              break;
            case 'streak_7':
              shouldUnlock = prev.streak >= 7;
              break;
            case 'streak_30':
              shouldUnlock = prev.streak >= 30;
              break;
            case 'level_5':
              shouldUnlock = prev.level >= 5;
              break;
            case 'level_10':
              shouldUnlock = prev.level >= 10;
              break;
          }
          
          if (shouldUnlock) {
            const unlockedAchievement = {
              ...achievement,
              unlockedAt: new Date().toISOString()
            };
            newAchievements.push(unlockedAchievement);
            
            // Add to new achievements for notification
            setNewAchievements(prev => [...prev, unlockedAchievement]);
          }
        }
      });
      
      return {
        ...prev,
        achievements: newAchievements
      };
    });
  };

  const clearNewAchievements = () => {
    setNewAchievements([]);
  };

  return (
    <XPContext.Provider value={{
      xpData,
      addXP,
      completeLesson,
      updateStreak,
      checkAchievements,
      newAchievements,
      clearNewAchievements
    }}>
      {children}
    </XPContext.Provider>
  );
};

export const useXP = () => {
  const context = useContext(XPContext);
  if (!context) {
    throw new Error('useXP must be used within an XPProvider');
  }
  return context;
};

