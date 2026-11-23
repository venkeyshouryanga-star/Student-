import {
  Award,
  BookOpenCheck,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { useMarks } from '../context/MarksContext';
import { UserRole } from '../types';

const DEMO_ROLES: Array<{
  role: UserRole;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    role: 'ADMIN',
    label: 'Admin',
    icon: <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />,
  },
  {
    role: 'TEACHER',
    label: 'Teacher',
    icon: <BookOpenCheck className="w-4 h-4 text-indigo-600 shrink-0" />,
  },
  {
    role: 'HOD',
    label: 'HOD',
    icon: <Users className="w-4 h-4 text-indigo-600 shrink-0" />,
  },
  {
    role: 'STUDENT',
    label: 'Student',
    icon: <Award className="w-4 h-4 text-indigo-600 shrink-0" />,
  },
];

export function LoginPage() {
  const { login, loginAsDemo } = useMarks();
  const [email, setEmail] = useState('admin@university.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-[#F9FAFB]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 15%, rgba(79, 70, 229, 0.06), transparent 45%), radial-gradient(circle at 80% 85%, rgba(30, 27, 75, 0.05), transparent 45%)',
      }}
    >
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8 shadow-xl shadow-gray-900/5">
        {/* Clean Institutional Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-xl bg-[#1E1B4B] text-white flex items-center justify-center mb-4">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Sign in to VVITU Portal
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            University Student Marks Management
          </p>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-medium text-gray-700 mb-1.5"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-medium text-gray-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 pr-10 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Sign In
          </button>
        </form>

        {/* Subtle Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-400">
              Quick demo access
            </span>
          </div>
        </div>

        {/* 4 Sleek One-Click Role Cards */}
        <div className="grid grid-cols-2 gap-3">
          {DEMO_ROLES.map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => loginAsDemo(item.role)}
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-indigo-50/60 hover:border-indigo-200 text-left transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <span className="text-sm font-medium text-gray-800">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
