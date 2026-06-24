import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportAPI } from '../api';
import { formatCurrency, formatDate } from '../utils/formatters';
import Loading from '../components/Common/Loading';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
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
    {
      name: 'Total Portfolio',
      value: formatCurrency(portfolio?.data?.total_portfolio || 0),
      color: '#0ea5e9',
    },
    {
      name: 'Active Loans',
      value: portfolio?.data?.active_loans || 0,
      color: '#22c55e',
    },
    {
      name: 'Total Customers',
      value: portfolio?.data?.total_customers || 0,
      color: '#8b5cf6',
    },
    {
      name: 'Collection Rate',
      value: `${portfolio?.data?.collection_rate || 0}%`,
      color: '#f59e0b',
    },
  ];

  // Export Portfolio Report
  const exportPortfolioReport = () => {
    const data = [
      { 'Metric': 'Total Portfolio', 'Value': formatCurrency(portfolio?.data?.total_portfolio || 0) },
      { 'Metric': 'Active Loans', 'Value': portfolio?.data?.active_loans || 0 },
      { 'Metric': 'Total Customers', 'Value': portfolio?.data?.total_customers || 0 },
      { 'Metric': 'Collection Rate', 'Value': `${portfolio?.data?.collection_rate || 0}%` },
      { 'Metric': 'Performing Loans', 'Value': `${portfolio?.data?.performing || 0}%` },
      { 'Metric': 'Overdue Rate', 'Value': `${portfolio?.data?.overdue_rate || 0}%` },
      { 'Metric': 'Default Rate', 'Value': `${portfolio?.data?.default_rate || 0}%` },
      { 'Metric': 'PAR 30', 'Value': `${portfolio?.data?.par_30 || 0}%` },
      { 'Metric': 'Overdue Loans', 'Value': portfolio?.data?.overdue_loans || 0 },
      { 'Metric': 'Defaulted Loans', 'Value': portfolio?.data?.defaulted_loans || 0 },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Portfolio Report');
    
    const filename = `Portfolio_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, filename);
  };

  // Export Collections Report
  const exportCollectionsReport = () => {
    const data = [
      { 'Metric': 'Expected Collections', 'Value': formatCurrency(collections?.data?.expected || 0) },
      { 'Metric': 'Actual Collections', 'Value': formatCurrency(collections?.data?.actual || 0) },
      { 'Metric': 'Collection Efficiency', 'Value': `${collections?.data?.efficiency || 0}%` },
      { 'Metric': 'Overdue Amount', 'Value': formatCurrency(collections?.data?.overdue || 0) },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Collections Report');
    
    const filename = `Collections_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
        <div className="flex gap-2">
          <button 
            onClick={exportPortfolioReport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Export Portfolio
          </button>
          <button 
            onClick={exportCollectionsReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export Collections
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Apply Filter
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium text-gray-600">{stat.name}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collections Report */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Collections Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Expected Collections</span>
              <span className="font-medium">{formatCurrency(collections?.data?.expected || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Actual Collections</span>
              <span className="font-medium text-green-600">{formatCurrency(collections?.data?.actual || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Collection Efficiency</span>
              <span className="font-medium text-blue-600">{collections?.data?.efficiency || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Overdue Amount</span>
              <span className="font-medium text-red-600">{formatCurrency(collections?.data?.overdue || 0)}</span>
            </div>
          </div>
        </div>

        {/* Portfolio Quality */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Quality</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Performing Loans</span>
              <span className="font-medium text-green-600">{portfolio?.data?.performing || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Overdue Loans</span>
              <span className="font-medium text-yellow-600">{portfolio?.data?.overdue_rate || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Default Rate</span>
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