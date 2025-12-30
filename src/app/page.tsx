'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        // Store user data (Context or LocalStorage for simplicity now)
        localStorage.setItem('user', JSON.stringify(data.data));

        // Redirect based on role
        if (data.data.role === 'Admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/agent/deposito');
        }
      } else {
        setError(data.error || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side: Branding / Background Image Integration (Full Half) */}
      <div className="hidden lg:flex lg:w-1/2 relative h-screen flex-col items-start justify-center text-white overflow-hidden">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <NextImage
            src="/legumes.png"
            alt="Background Legumes"
            fill
            className="object-cover opacity-80"
            priority
          />
          {/* Professional Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-blue-900/20"></div>
        </div>

        {/* Content Layered on top */}
        <div className="relative z-10 p-20 w-full h-full flex flex-col justify-center">
          <div className="relative w-64 h-32 mb-8 drop-shadow-2xl">
            <NextImage
              src="/bmii.png"
              alt="BMII Logo"
              fill
              className="object-contain object-left"
            />
          </div>
          <h1 className="text-6xl font-black italic text-white mb-6 drop-shadow-lg tracking-tight">
            Online Banking
          </h1>
          <p className="text-white text-2xl max-w-lg font-light leading-relaxed drop-shadow-md opacity-90">
            Bem-vindo ao Banco de Mercadoria do Investimento Integrado.
            Acesse sua conta com as suas credenciais, ou contacte o seu administrador para suporte técnico.
          </p>

          <div className="mt-16 flex items-end gap-3 opacity-60">
            <div className="w-4 h-20 bg-white rounded-full"></div>
            <div className="w-4 h-32 bg-white rounded-full"></div>
            <div className="w-4 h-16 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Side: Custom Styled Form */}
      <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 p-8">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-12 relative w-48 h-24">
          <NextImage
            src="/bmii.png"
            alt="BMII Logo"
            fill
            className="object-contain"
          />
        </div>

        <StyledWrapper>
          <div className="container">
            <div className="heading">Entrar</div>
            <form className="form" onSubmit={handleLogin}>
              <input
                required
                className="input"
                type="email"
                name="email"
                id="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                required
                className="input"
                type="password"
                name="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="forgot-password"><a href="#">Forgot Password ?</a></span>
              {error && <p className="text-red-500 text-xs mt-2 ml-2 font-semibold">{error}</p>}
              <input
                className="login-button disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                value={isLoading ? 'A entrar...' : 'Entrar'}
                disabled={isLoading}
              />
            </form>
            <span className="agreement"><a href="#">Ao entrar você concorda com os termos de uso</a></span>
          </div>
        </StyledWrapper>
      </div>
    </main>
  );
}

const StyledWrapper = styled.div`
  .container {
    max-width: 350px;
    width: 100%;
    background: #F8F9FD;
    background: linear-gradient(0deg, rgb(255, 255, 255) 0%, rgb(244, 247, 251) 100%);
    border-radius: 40px;
    padding: 25px 35px;
    border: 5px solid rgb(255, 255, 255);
    box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 30px 30px -20px;
  }

  .heading {
    text-align: center;
    font-weight: 900;
    font-size: 30px;
    color: rgb(16, 137, 211);
  }

  .form {
    margin-top: 20px;
  }

  .form .input {
    width: 100%;
    background: white;
    border: none;
    padding: 15px 20px;
    border-radius: 20px;
    margin-top: 15px;
    box-shadow: #cff0ff 0px 10px 10px -5px;
    border-inline: 2px solid transparent;
    color: #333;
  }

  .form .input::-moz-placeholder {
    color: rgb(170, 170, 170);
  }

  .form .input::placeholder {
    color: rgb(170, 170, 170);
  }

  .form .input:focus {
    outline: none;
    border-inline: 2px solid #12B1D1;
  }

  .form .forgot-password {
    display: block;
    margin-top: 10px;
    margin-left: 10px;
  }

  .form .forgot-password a {
    font-size: 11px;
    color: #0099ff;
    text-decoration: none;
  }

  .form .login-button {
    display: block;
    width: 100%;
    font-weight: bold;
    background: linear-gradient(45deg, rgb(16, 137, 211) 0%, rgb(18, 177, 209) 100%);
    color: white;
    padding-block: 15px;
    margin: 20px auto;
    border-radius: 20px;
    box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 20px 10px -15px;
    border: none;
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }

  .form .login-button:hover {
    transform: scale(1.03);
    box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 23px 10px -20px;
  }

  .form .login-button:active {
    transform: scale(0.95);
    box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 15px 10px -10px;
  }

  .social-account-container {
    margin-top: 25px;
  }

  .social-account-container .title {
    display: block;
    text-align: center;
    font-size: 10px;
    color: rgb(170, 170, 170);
  }

  .social-account-container .social-accounts {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 5px;
  }

  .social-account-container .social-accounts .social-button {
    background: linear-gradient(45deg, rgb(0, 0, 0) 0%, rgb(112, 112, 112) 100%);
    border: 5px solid white;
    padding: 5px;
    border-radius: 50%;
    width: 40px;
    aspect-ratio: 1;
    display: grid;
    place-content: center;
    box-shadow: rgba(133, 189, 215, 0.8784313725) 0px 12px 10px -8px;
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }

  .social-account-container .social-accounts .social-button .svg {
    fill: white;
    margin: auto;
  }

  .social-account-container .social-accounts .social-button:hover {
    transform: scale(1.2);
  }

  .social-account-container .social-accounts .social-button:active {
    transform: scale(0.9);
  }

  .agreement {
    display: block;
    text-align: center;
    margin-top: 15px;
  }

  .agreement a {
    text-decoration: none;
    color: #0099ff;
    font-size: 9px;
  }
`;

export default LoginPage;
