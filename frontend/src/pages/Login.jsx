import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const Login = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData);
      
      if (result.success) {
        toast.success(t('Kuingia kumefanikiwa!'));
        navigate('/app');
      } else {
        const errorMsg = result.error?.detail || 
                        result.error?.message || 
                        t('Kitambulisho au nenosiri si sahihi. Tafadhali jaribu tena.');
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMsg = t('Hitilafu imetokea wakati wa kuingia. Tafadhali jaribu tena.');
      
      if (err.response?.status === 403) {
        errorMsg = t('Ufikiaji umekataliwa. Tafadhali angalia kitambulisho chako.');
      } else if (err.response?.status === 401) {
        errorMsg = t('Kitambulisho au nenosiri si sahihi.');
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <span className="text-white text-3xl font-bold">M</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">MicroFinance System</h2>
          <p className="mt-2 text-gray-600">{t('Jukwaa Linaloongoza la Mikopo Ndogo Tanzania')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('Ingia kwenye akaunti yako')}</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Jina la Mtumiaji')}</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('Weka jina lako la mtumiaji')}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Nenosiri')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={t('Weka nenosiri lako')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? t('Ficha') : t('Onyesha')}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input type="checkbox" id="remember" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">{t('Nikumbuke')}</label>
              </div>
              <button type="button" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                {t('Umesahau nenosiri?')}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('Inaingia...') : t('Ingia')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('Huna akaunti?')}{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('Unda sasa')}
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">2026 MicroFinance System. {t('Haki zote zimehifadhiwa.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;