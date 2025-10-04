"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 hover:bg-gray-100 transition-colors"
      title={language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">
        {language === 'vi' ? 'EN' : 'VI'}
      </span>
    </Button>
  );
}


