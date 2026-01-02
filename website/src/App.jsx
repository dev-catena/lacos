import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FornecedorPage from './pages/FornecedorPage';
import SupplierRegisterPage from './pages/SupplierRegisterPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/fornecedor" element={<FornecedorPage />} />
        <Route path="/fornecedor/cadastro" element={<SupplierRegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<SignUpPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/perfil/trocar-senha" element={<ChangePasswordPage />} />
      </Routes>
    </Router>
  );
}

export default App;


