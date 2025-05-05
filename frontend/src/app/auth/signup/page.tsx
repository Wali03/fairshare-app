'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../auth.css';
import { useAuthStore } from '@/lib/stores/authStore';
import Image from 'next/image';

export default function SignUp() {
  const router = useRouter();
  const { signup, sendOtp, isLoading, error } = useAuthStore();
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: Full signup
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [formError, setFormError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setFormError('Email is required');
      return;
    }

    try {
      setOtpSending(true);
      await sendOtp(formData.email);
      setOtpSent(true);
      setStep(2);
      setFormError('');
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (!formData.otp) {
      setFormError('OTP is required');
      return;
    }

    try {
      await signup(
        formData.name, 
        formData.email, 
        formData.password, 
        formData.confirmPassword,
        formData.otp
      );
      // Redirect to login page after successful signup
      router.push('/auth/login?success=Account created successfully! Please login.');
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="form-box register">
        <div className="logo-container">
          <div className="logo">FS</div>
          <h1>FairShare</h1>
        </div>
        
        <h2 className="title animation" style={{ '--i': 17, '--j': 0 } as React.CSSProperties}>
          {step === 1 ? 'Get Started' : 'Complete Your Registration'}
        </h2>

        {(formError || error) && (
          <div className="error-message animation" style={{ '--i': 17, '--j': 0 } as React.CSSProperties}>
            {formError || error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
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

            <p className="info-text animation" style={{ '--i': 19, '--j': 2 } as React.CSSProperties}>
              We'll send a verification code to this email
            </p>

            <button 
              type="submit" 
              className="btn animation" 
              style={{ '--i': 20, '--j': 3 } as React.CSSProperties}
              disabled={otpSending}
            >
              {otpSending ? 'Sending OTP...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-box animation" style={{ '--i': 18, '--j': 1 } as React.CSSProperties}>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required 
              />
              <label>Full Name</label>
              <i className="bx bxs-user"></i>
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

            <div className="input-box animation" style={{ '--i': 20, '--j': 3 } as React.CSSProperties}>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required 
              />
              <label>Confirm Password</label>
              <i className="bx bxs-lock-alt"></i>
            </div>

            <div className="input-box animation" style={{ '--i': 21, '--j': 4 } as React.CSSProperties}>
              <input 
                type="text" 
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                required 
                maxLength={6}
              />
              <label>OTP Code</label>
              <i className="bx bx-code-alt"></i>
            </div>

            <p className="otp-info animation" style={{ '--i': 22, '--j': 5 } as React.CSSProperties}>
              OTP sent to {formData.email}. 
              <button 
                type="button" 
                className="resend-btn"
                onClick={handleSendOtp}
                disabled={otpSending}
              >
                {otpSending ? 'Sending...' : 'Resend'}
              </button>
            </p>

            <button 
              type="submit" 
              className="btn animation" 
              style={{ '--i': 23, '--j': 6 } as React.CSSProperties}
              disabled={isLoading}
            >
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        )}

        <div className="toggle-form animation" style={{ '--i': 24, '--j': 7 } as React.CSSProperties}>
          Already have an account? <Link href="/auth/login">Login</Link>
        </div>
      </div>
    </div>
  );
} 