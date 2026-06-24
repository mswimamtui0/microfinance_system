import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loanAPI, productAPI, customerAPI } from '../api';
import LoanApplication from '../components/Loans/LoanApplication';
import LoanDetails from '../components/Loans/LoanDetails';
import Loading from '../components/Common/Loading';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';

const Loans = () => {
  const { t } = useTranslation();
  const [showApplication, setShowApplication] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('all');

  const queryClient = useQueryClient();

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ['loans', searchTerm, statusFilter],
    queryFn: () => loanAPI.getAll({ search: searchTerm, status: statusFilter }),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll(),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getAll({ limit: 1000 }),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => loanAPI.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['loans']);
      toast.success(t('Mkopo umekubaliwa kikamilifu'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('Imeshindwa kukubali mkopo'));
    },
  });

  const disburseMutation = useMutation({
    mutationFn: (id) => loanAPI.disburse(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['loans']);
      toast.success(t('Mkopo umetolewa kikamilifu'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('Imeshindwa kutoa mkopo'));
    },
  });

  if (loansLoading) return <Loading />;

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      disbursed: 'bg-purple-100 text-purple-800',
      active: 'bg-green-100 text-green-800',
      paid: 'bg-gray-100 text-gray-800',
      defaulted: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredLoans = loans?.data?.results?.filter(loan => {
    if (viewMode === 'pending') return loan.status === 'pending';
    if (viewMode === 'approved') return loan.status === 'approved';
    if (viewMode === 'active') return loan.status === 'active';
    if (viewMode === 'draft') return loan.status === 'draft';
    return true;
  });

  const allLoans = loans?.data?.results || [];
  const draftCount = allLoans.filter(l => l.status === 'draft').length;
  const pendingCount = allLoans.filter(l => l.status === 'pending').length;
  const approvedCount = allLoans.filter(l => l.status === 'approved').length;
  const activeCount = allLoans.filter(l => l.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{t('Usimamizi wa Mikopo')}</h1>
        <button onClick={() => setShowApplication(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          {t('Mkopo Mpya')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">{t('Mikopo Yote')}</p>
          <p className="text-2xl font-bold text-gray-900">{allLoans.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">{t('Rasimu')}</p>
          <p className="text-2xl font-bold text-gray-900">{draftCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">{t('Inasubiri')}</p>
          <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">{t('Inaendelea')}</p>
          <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        <button onClick={() => setViewMode('all')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: viewMode === 'all' ? '#0284c7' : 'transparent', color: viewMode === 'all' ? 'white' : '#4b5563', cursor: 'pointer', fontWeight: '500' }}>{t('Mikopo Yote')}</button>
        <button onClick={() => setViewMode('draft')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: viewMode === 'draft' ? '#6b7280' : 'transparent', color: viewMode === 'draft' ? 'white' : '#4b5563', cursor: 'pointer', fontWeight: '500' }}>{t('Rasimu')}</button>
        <button onClick={() => setViewMode('pending')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: viewMode === 'pending' ? '#f59e0b' : 'transparent', color: viewMode === 'pending' ? 'white' : '#4b5563', cursor: 'pointer', fontWeight: '500' }}>{t('Inasubiri')}</button>
        <button onClick={() => setViewMode('approved')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: viewMode === 'approved' ? '#3b82f6' : 'transparent', color: viewMode === 'approved' ? 'white' : '#4b5563', cursor: 'pointer', fontWeight: '500' }}>{t('Imekubaliwa')}</button>
        <button onClick={() => setViewMode('active')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: viewMode === 'active' ? '#22c55e' : 'transparent', color: viewMode === 'active' ? 'white' : '#4b5563', cursor: 'pointer', fontWeight: '500' }}>{t('Inaendelea')}</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input type="text" placeholder={t('Tafuta mikopo kwa nambari au mteja...')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
          <option value="">{t('Hali Zote')}</option>
          <option value="draft">{t('Rasimu')}</option>
          <option value="pending">{t('Inasubiri')}</option>
          <option value="approved">{t('Imekubaliwa')}</option>
          <option value="disbursed">{t('Imetolewa')}</option>
          <option value="active">{t('Inaendelea')}</option>
          <option value="paid">{t('Imelipwa')}</option>
          <option value="defaulted">{t('Imeshindwa')}</option>
          <option value="rejected">{t('Imekataliwa')}</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Nambari ya Mkopo')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Mteja')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Bidhaa')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Kiasi')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Hali')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Salio')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Vitendo')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoans?.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loan.loan_no}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.customer_details?.first_name} {loan.customer_details?.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.product_details?.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(loan.principal)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>{t(loan.status)}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(loan.outstanding_balance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button onClick={() => setSelectedLoan(loan)} className="text-primary-600 hover:text-primary-900 font-medium mr-2">{t('Tazama')}</button>
                    {loan.status === 'pending' && <button onClick={() => approveMutation.mutate(loan.id)} className="text-green-600 hover:text-green-900 font-medium mr-2">{t('Kubali')}</button>}
                    {loan.status === 'approved' && <button onClick={() => disburseMutation.mutate(loan.id)} className="text-blue-600 hover:text-blue-900 font-medium mr-2">{t('Toa')}</button>}
                    {loan.status === 'draft' && <button onClick={() => approveMutation.mutate(loan.id)} className="text-yellow-600 hover:text-yellow-900 font-medium">{t('Wasilisha kwa Idhini')}</button>}
                    {loan.status === 'active' && <button onClick={() => window.location.href = `/payments/new?loan=${loan.id}`} className="text-purple-600 hover:text-purple-900 font-medium">{t('Pokea Malipo')}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showApplication && <LoanApplication onClose={() => setShowApplication(false)} products={products?.data?.results || []} customers={customers?.data?.results || []} />}
      {selectedLoan && <LoanDetails loan={selectedLoan} onClose={() => setSelectedLoan(null)} />}
    </div>
  );
};

export default Loans;