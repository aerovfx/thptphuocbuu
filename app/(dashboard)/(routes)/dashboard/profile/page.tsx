"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Award,
  BookOpen,
  Clock,
  Star,
  Edit3,
  Save,
  X,
  Camera,
  Settings,
  Bell,
  Shield,
  Palette,
  Globe,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Lock,
  Key,
  Trash2,
  Download,
  Upload,
  Share2,
  Heart,
  MessageCircle,
  Users,
  Trophy,
  Target,
  TrendingUp,
  Activity
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea as UITextarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  dateOfBirth?: Date;
  role: string;
  joinDate: Date;
  lastActive: Date;
  preferences: {
    theme: "light" | "dark" | "system";
    language: "vi" | "en";
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisible: boolean;
      emailVisible: boolean;
      phoneVisible: boolean;
    };
  };
  stats: {
    coursesCompleted: number;
    totalStudyTime: number; // in minutes
    achievements: number;
    streak: number;
    level: number;
    xp: number;
  };
  achievements: Achievement[];
  recentActivity: Activity[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  category: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  icon: string;
}

const themes = [
  { value: "light", label: "Sáng", icon: Sun },
  { value: "dark", label: "Tối", icon: Moon },
  { value: "system", label: "Hệ thống", icon: Monitor }
];

const languages = [
  { value: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { value: "en", label: "English", flag: "🇺🇸" }
];

export default function ProfileModule() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language, toggleLanguage } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/sign-in");
      return;
    }

    // Load profile from localStorage or create default
    const savedProfile = localStorage.getItem(`profile_${session.user.id}`);
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfile({
        ...parsedProfile,
        dateOfBirth: parsedProfile.dateOfBirth ? new Date(parsedProfile.dateOfBirth) : undefined,
        joinDate: new Date(parsedProfile.joinDate),
        lastActive: new Date(parsedProfile.lastActive),
        achievements: parsedProfile.achievements.map((a: any) => ({
          ...a,
          earnedAt: new Date(a.earnedAt)
        })),
        recentActivity: parsedProfile.recentActivity.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }))
      });
    } else {
      // Create default profile
      const defaultProfile: UserProfile = {
        id: session.user.id,
        name: session.user.name || "Người dùng",
        email: session.user.email || "",
        phone: "",
        avatar: "",
        bio: "Chào mừng bạn đến với inPhysic! Hãy cập nhật thông tin cá nhân của bạn.",
        location: "",
        dateOfBirth: undefined,
        role: session.user.role || "STUDENT",
        joinDate: new Date(),
        lastActive: new Date(),
        preferences: {
          theme: "system",
          language: "vi",
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          privacy: {
            profileVisible: true,
            emailVisible: false,
            phoneVisible: false
          }
        },
        stats: {
          coursesCompleted: 0,
          totalStudyTime: 0,
          achievements: 0,
          streak: 0,
          level: 1,
          xp: 0
        },
        achievements: [],
        recentActivity: [
          {
            id: "1",
            type: "welcome",
            description: "Chào mừng bạn đến với inPhysic!",
            timestamp: new Date(),
            icon: "🎉"
          }
        ]
      };
      
      setProfile(defaultProfile);
      saveProfile(defaultProfile);
    }
  }, [session, status, router]);

  const saveProfile = (profileToSave: UserProfile) => {
    if (session?.user?.id) {
      localStorage.setItem(`profile_${session.user.id}`, JSON.stringify(profileToSave));
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (profile) {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      saveProfile(updatedProfile);
    }
  };

  const updatePreferences = (preferenceUpdates: Partial<UserProfile["preferences"]>) => {
    if (profile) {
      const updatedPreferences = { ...profile.preferences, ...preferenceUpdates };
      updateProfile({ preferences: updatedPreferences });
    }
  };

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingField && profile) {
      const updates: any = {};
      updates[editingField] = editValue;
      updateProfile(updates);
    }
    setEditingField(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN');
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getLevelProgress = () => {
    if (!profile) return 0;
    const currentLevelXp = profile.stats.level * 1000;
    const nextLevelXp = (profile.stats.level + 1) * 1000;
    const progress = ((profile.stats.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session || !profile) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <User className="h-8 w-8 text-blue-600" />
            Hồ sơ cá nhân
          </h1>
          <p className="text-muted-foreground">
            Quản lý thông tin cá nhân và tùy chỉnh trải nghiệm của bạn
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit3 className="h-4 w-4 mr-2" />
            {isEditing ? "Xem" : "Chỉnh sửa"}
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Xuất dữ liệu
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="personal">Thông tin cá nhân</TabsTrigger>
          <TabsTrigger value="preferences">Tùy chỉnh</TabsTrigger>
          <TabsTrigger value="achievements">Thành tích</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="lg:col-span-1">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback className="text-2xl">
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <h2 className="text-xl font-bold mb-1">{profile.name}</h2>
                <p className="text-muted-foreground mb-2">{profile.email}</p>
                
                <Badge variant="secondary" className="mb-4">
                  {profile.role === "STUDENT" ? "Học sinh" : 
                   profile.role === "TEACHER" ? "Giáo viên" : "Quản trị viên"}
                </Badge>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Tham gia: {formatDate(profile.joinDate)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Hoạt động cuối: {formatDate(profile.lastActive)}</span>
                  </div>
                  {profile.location && (
                    <div className="flex items-center justify-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
                
                {profile.bio && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{profile.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Level Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Cấp độ & Kinh nghiệm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cấp {profile.stats.level}</span>
                      <span className="text-sm text-muted-foreground">
                        {profile.stats.xp} XP
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${getLevelProgress()}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cần {(profile.stats.level + 1) * 1000 - profile.stats.xp} XP để lên cấp {profile.stats.level + 1}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BookOpen className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Khóa học hoàn thành</p>
                        <p className="text-2xl font-bold">{profile.stats.coursesCompleted}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Thời gian học</p>
                        <p className="text-2xl font-bold">{formatTime(profile.stats.totalStudyTime)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Award className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Thành tích</p>
                        <p className="text-2xl font-bold">{profile.stats.achievements}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Target className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Chuỗi ngày</p>
                        <p className="text-2xl font-bold">{profile.stats.streak}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Hoạt động gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <span className="text-2xl">{activity.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
                <CardDescription>
                  Cập nhật thông tin cá nhân của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Họ và tên</Label>
                  <div className="flex items-center gap-2">
                    {editingField === "name" ? (
                      <>
                        <Input
                          id="name"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                        <Button size="sm" onClick={saveEdit}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input value={profile.name} readOnly />
                        {isEditing && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEditing("name", profile.name)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} readOnly />
                </div>

                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <div className="flex items-center gap-2">
                    {editingField === "phone" ? (
                      <>
                        <Input
                          id="phone"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                        <Button size="sm" onClick={saveEdit}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input value={profile.phone || ""} readOnly />
                        {isEditing && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEditing("phone", profile.phone || "")}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Địa chỉ</Label>
                  <div className="flex items-center gap-2">
                    {editingField === "location" ? (
                      <>
                        <Input
                          id="location"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                        <Button size="sm" onClick={saveEdit}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input value={profile.location || ""} readOnly />
                        {isEditing && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEditing("location", profile.location || "")}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Giới thiệu bản thân</Label>
                  <div className="flex items-start gap-2">
                    {editingField === "bio" ? (
                      <>
                        <UITextarea
                          id="bio"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <div className="flex flex-col gap-1">
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <UITextarea 
                          value={profile.bio || ""} 
                          readOnly 
                          className="min-h-[100px]"
                        />
                        {isEditing && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEditing("bio", profile.bio || "")}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bảo mật</CardTitle>
                <CardDescription>
                  Quản lý bảo mật tài khoản của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mật khẩu</Label>
                    <p className="text-sm text-muted-foreground">Cập nhật mật khẩu của bạn</p>
                  </div>
                  <Button variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Đổi mật khẩu
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Xác thực 2 bước</Label>
                    <p className="text-sm text-muted-foreground">Bảo mật tài khoản bằng 2FA</p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Phiên đăng nhập</Label>
                    <p className="text-sm text-muted-foreground">Quản lý các phiên đăng nhập</p>
                  </div>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Xem
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Xóa tài khoản</Label>
                    <p className="text-sm text-muted-foreground">Xóa vĩnh viễn tài khoản</p>
                  </div>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Giao diện
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Chủ đề</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {themes.map((theme) => (
                      <Button
                        key={theme.value}
                        variant={profile.preferences.theme === theme.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => updatePreferences({ theme: theme.value as any })}
                        className="flex flex-col items-center gap-1 h-auto py-3"
                      >
                        <theme.icon className="h-4 w-4" />
                        <span className="text-xs">{theme.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Ngôn ngữ</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {languages.map((lang) => (
                      <Button
                        key={lang.value}
                        variant={profile.preferences.language === lang.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updatePreferences({ language: lang.value as any });
                          if (lang.value !== language) {
                            toggleLanguage();
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Thông báo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
                  </div>
                  <Switch 
                    checked={profile.preferences.notifications.email}
                    onCheckedChange={(checked) => 
                      updatePreferences({
                        notifications: { ...profile.preferences.notifications, email: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push</Label>
                    <p className="text-sm text-muted-foreground">Thông báo đẩy trên trình duyệt</p>
                  </div>
                  <Switch 
                    checked={profile.preferences.notifications.push}
                    onCheckedChange={(checked) => 
                      updatePreferences({
                        notifications: { ...profile.preferences.notifications, push: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS</Label>
                    <p className="text-sm text-muted-foreground">Thông báo qua tin nhắn</p>
                  </div>
                  <Switch 
                    checked={profile.preferences.notifications.sms}
                    onCheckedChange={(checked) => 
                      updatePreferences({
                        notifications: { ...profile.preferences.notifications, sms: checked }
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Quyền riêng tư
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hiển thị hồ sơ</Label>
                    <p className="text-sm text-muted-foreground">Cho phép người khác xem hồ sơ</p>
                  </div>
                  <Switch 
                    checked={profile.preferences.privacy.profileVisible}
                    onCheckedChange={(checked) => 
                      updatePreferences({
                        privacy: { ...profile.preferences.privacy, profileVisible: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hiển thị email</Label>
                    <p className="text-sm text-muted-foreground">Cho phép hiển thị email công khai</p>
                  </div>
                  <Switch 
                    checked={profile.preferences.privacy.emailVisible}
                    onCheckedChange={(checked) => 
                      updatePreferences({
                        privacy: { ...profile.preferences.privacy, emailVisible: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Hiển thị số điện thoại</Label>
                    <p className="text-sm text-muted-foreground">Cho phép hiển thị số điện thoại</p>
                  </div>
                  <Switch 
                    checked={profile.preferences.privacy.phoneVisible}
                    onCheckedChange={(checked) => 
                      updatePreferences({
                        privacy: { ...profile.preferences.privacy, phoneVisible: checked }
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Thành tích của bạn
              </CardTitle>
              <CardDescription>
                Khám phá và mở khóa các thành tích mới
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.achievements.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Chưa có thành tích nào</h3>
                  <p className="text-muted-foreground">
                    Hãy bắt đầu học tập để mở khóa các thành tích đầu tiên!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.achievements.map((achievement) => (
                    <Card key={achievement.id} className="text-center">
                      <CardContent className="p-6">
                        <div className="text-4xl mb-3">{achievement.icon}</div>
                        <h3 className="font-semibold mb-2">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {achievement.description}
                        </p>
                        <Badge variant="secondary">
                          {formatDate(achievement.earnedAt)}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

