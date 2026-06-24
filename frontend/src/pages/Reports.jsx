import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportAPI } from '../api';
import { useTranslation } from 'react-i18next';
import Loading from '../components/Common/Loading';
import { formatCurrency } from '../utils/formatters';

const Reports = () => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio-report', dateRange],
    queryFn: () => reportAPI.getPortfolio(dateRange),
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ['collections-report', dateRange],
    queryFn: () => reportAPI.getCollections(dateRange),
  });

  if (portfolioLoading || collectionsLoading) return <Loading />;

  const stats = [
    { name: t('Jumla ya Kwingineko'), value: formatCurrency(portfolio?.data?.total_portfolio || 0), color: '#0ea5e9' },
    { name: t('Mikopo Inayoendelea'), value: portfolio?.data?.active_loans || 0, color: '#22c55e' },
    { name: t('Jumla ya Wateja'), value: portfolio?.data?.total_customers || 0, color: '#8b5cf6' },
    { name: t('Kiwango cha Makusanyo'), value: `${portfolio?.data?.collection_rate || 0}%`, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{t('Ripoti na Uchambuzi')}</h1>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">{t('Hamisha Ripoti')}</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Tarehe ya Kuanza')}</label>
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Tarehe ya Mwisho')}</label>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">{t('Weka Kichujio')}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">{stat.name}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('Muhtasari wa Makusanyo')}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('Makusanyo Yanayotarajiwa')}</span>
              <span className="font-medium">{formatCurrency(collections?.data?.expected || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('Makusanyo Halisi')}</span>
              <span className="font-medium text-green-600">{formatCurrency(collections?.data?.actual || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('Ufanisi wa Makusanyo')}</span>
              <span className="font-medium text-blue-600">{collections?.data?.efficiency || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">{t('Kiasi Kilichochelewa')}</span>
              <span className="font-medium text-red-600">{formatCurrency(collections?.data?.overdue || 0)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('Ubora wa Kwingineko')}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('Inaendelea Vizuri')}</span>
              <span className="font-medium text-green-600">{portfolio?.data?.performing || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('Mikopo Iliyochelewa')}</span>
              <span className="font-medium text-yellow-600">{portfolio?.data?.overdue_rate || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('Kiwango cha Kushindwa')}</span>
              <span className="font-medium text-red-600">{portfolio?.data?.default_rate || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">PAR 30</span>
              <span className="font-medium text-orange-600">{portfolio?.data?.par_30 || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;