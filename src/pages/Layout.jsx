
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  BarChart3, 
  Database, 
  TrendingUp, 
  Users, 
  FileText,
  Settings,
  Bell,
  Search,
  ChevronRight
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  {
    title: "Executive Dashboard",
    url: createPageUrl("Dashboard"),
    icon: BarChart3,
    description: "Key metrics & insights",
    color: "blue"
  },
  {
    title: "Data Management",
    url: createPageUrl("DataManagement"),
    icon: Database,
    description: "Upload & manage data",
    color: "emerald"
  },
  {
    title: "Analytics Hub",
    url: createPageUrl("Analytics"),
    icon: TrendingUp,
    description: "Deep-dive analysis",
    color: "purple"
  },
  {
    title: "Forecasting",
    url: createPageUrl("Forecasting"),
    icon: Users,
    description: "Predictive workforce planning",
    color: "orange"
  },
  {
    title: "Reports",
    url: createPageUrl("Reports"),
    icon: FileText,
    description: "Export & insights",
    color: "indigo"
  }
];

const colorVariants = {
  blue: {
    bg: "bg-blue-500",
    bgLight: "bg-blue-100",
    text: "text-blue-600",
    border: "border-blue-200"
  },
  emerald: {
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-100",
    text: "text-emerald-600",
    border: "border-emerald-200"
  },
  purple: {
    bg: "bg-purple-500",
    bgLight: "bg-purple-100",
    text: "text-purple-600",
    border: "border-purple-200"
  },
  orange: {
    bg: "bg-orange-500",
    bgLight: "bg-orange-100",
    text: "text-orange-600",
    border: "border-orange-200"
  },
  indigo: {
    bg: "bg-indigo-500",
    bgLight: "bg-indigo-100",
    text: "text-indigo-600",
    border: "border-indigo-200"
  }
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <style>
        {`
          :root {
            --primary-navy: #1e293b;
            --primary-blue: #3b82f6;
            --accent-indigo: #6366f1;
            --soft-gray: #f8fafc;
            --border-light: #e2e8f0;
          }
          
          .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          
          .nav-card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(226, 232, 240, 0.5);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .nav-card:hover {
            background: rgba(255, 255, 255, 0.95);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }
          
          .nav-card.active {
            background: rgba(255, 255, 255, 1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
          }
          
          .sidebar-gradient {
            background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          }
        `}
      </style>
      
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar className="border-r border-slate-200 sidebar-gradient">
            <SidebarHeader className="border-b border-slate-200 p-6 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-slate-800">iTAV</h2>
                  <p className="text-xs text-slate-500 font-medium">Customer & Sector Insights</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-4">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-3 mb-2">
                  Workforce Management
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-3">
                    {navigationItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      const colors = colorVariants[item.color];
                      
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild className="p-0 h-auto">
                            <Link to={item.url}>
                              <div className={`
                                nav-card w-full p-4 rounded-xl group cursor-pointer
                                ${isActive ? 'active' : ''}
                              `}>
                                <div className="flex items-center gap-4">
                                  <div className={`
                                    w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300
                                    ${isActive 
                                      ? `${colors.bg} shadow-lg` 
                                      : `${colors.bgLight} group-hover:${colors.bg}`
                                    }
                                  `}>
                                    <item.icon className={`w-6 h-6 transition-colors duration-300 ${
                                      isActive 
                                        ? 'text-white' 
                                        : `${colors.text} group-hover:text-white`
                                    }`} />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <h3 className={`font-semibold text-sm transition-colors duration-300 ${
                                      isActive ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'
                                    }`}>
                                      {item.title}
                                    </h3>
                                    <p className={`text-xs mt-1 transition-colors duration-300 ${
                                      isActive ? 'text-slate-600' : 'text-slate-500 group-hover:text-slate-600'
                                    }`}>
                                      {item.description}
                                    </p>
                                  </div>
                                  
                                  <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                                    isActive 
                                      ? `${colors.text} transform translate-x-1` 
                                      : 'text-slate-400 group-hover:text-slate-600 group-hover:transform group-hover:translate-x-1'
                                  }`} />
                                </div>
                                
                                {isActive && (
                                  <div className={`mt-3 pt-3 border-t ${colors.border}`}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                                      <span className={`text-xs font-medium ${colors.text}`}>Currently Active</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup className="mt-8">
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-3 mb-2">
                  System Status
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="nav-card p-4 rounded-xl">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Data Freshness</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Live</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Forecast Model</span>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Coverage</span>
                        <span className="text-sm font-semibold text-emerald-600">98.5%</span>
                      </div>
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200 p-4 bg-white/80 backdrop-blur-sm">
              <div className="nav-card p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">WM</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">Workforce Manager</p>
                    <p className="text-xs text-slate-500 truncate">Medicare Plan Analytics</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col min-h-screen">
            {/* Top Header for Mobile */}
            <header className="lg:hidden bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                  <div>
                    <h1 className="text-lg font-bold text-slate-900">iTAV</h1>
                    <p className="text-xs text-slate-500">Workforce Analytics</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Bell className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
