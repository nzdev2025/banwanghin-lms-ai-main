import React, { useState } from 'react';
import { handleLogin, handleSignUp } from '../firebase/firebase';
import { useSiteConfig } from '../context/SiteConfigContext';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

const featureHighlights = [
  'จัดเก็บข้อมูลนักเรียน รายวิชา และคะแนนอย่างเป็นระบบ',
  'สร้างสื่อ ใบงาน ข้อสอบ และแผนการสอนด้วย AI ในไม่กี่คลิก',
  'แดชบอร์ดภาพรวมโรงเรียนแบบเรียลไทม์เพื่อช่วยตัดสินใจ',
];

const LoginView = () => {
  const { siteConfig } = useSiteConfig();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onLogin = async (email, password) => {
    setIsLoading(true);
    setError('');
    try {
      await handleLogin(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async (email, password) => {
    setIsLoading(true);
    setError('');
    try {
      await handleSignUp(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={siteConfig.siteTitle}
      footerText={siteConfig.footerText}
      highlights={featureHighlights}
    >
      <LoginForm
        onLogin={onLogin}
        onSignUp={onSignUp}
        isLoading={isLoading}
        siteTitle={siteConfig.siteTitle}
        error={error}
      />
    </AuthLayout>
  );
};

export default LoginView;