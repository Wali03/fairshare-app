'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../auth.css';
import { useAuthStore } from '@/lib/stores/authStore';

export default function Login() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    try {
      await login(formData.email, formData.password);
      router.push('/dashboard');
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-container">
      <div className="form-box login">
        <div className="logo-container">
          <div className="logo">FS</div>
          <h1>FairShare</h1>
        </div>
        
        <h2 className="title animation" style={{ '--i': 17, '--j': 0 } as React.CSSProperties}>
          Welcome Back
        </h2>

        {(formError || error) && (
          <div className="error-message animation" style={{ '--i': 17, '--j': 0 } as React.CSSProperties}>
            {formError || error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-box animation" style={{ '--i': 18, '--j': 1 } as React.CSSProperties}>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              required 
            />
            <label>Email</label>
            <i className="bx bxs-envelope"></i>
          </div>

          <div className="input-box animation" style={{ '--i': 19, '--j': 2 } as React.CSSProperties}>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              required 
            />
            <label>Password</label>
            <i className="bx bxs-lock-alt"></i>
          </div>

          <div className="remember-forgot animation" style={{ '--i': 20, '--j': 3 } as React.CSSProperties}>
            <label><input type="checkbox" /> Remember me</label>
            <a href="#">Forgot Password?</a>
          </div>

          <button 
            type="submit" 
            className="btn animation" 
            style={{ '--i': 21, '--j': 4 } as React.CSSProperties}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="toggle-form animation" style={{ '--i': 22, '--j': 5 } as React.CSSProperties}>
          Don&apos;t have an account? <Link href="/auth/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
} 