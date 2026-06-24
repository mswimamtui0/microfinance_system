import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerAPI } from '../api';
import CustomerForm from '../components/Customers/CustomerForm';
import Loading from '../components/Common/Loading';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const Customers = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', searchTerm, statusFilter],
    queryFn: () => customerAPI.getAll({ search: searchTerm, status: statusFilter }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => customerAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success(t('Mteja amefutwa kikamilifu'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('Imeshindwa kufuta mteja'));
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{t('Usimamizi wa Wateja')}</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          {t('Mteja Mpya')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('Tafuta wateja...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">{t('Hali Zote')}</option>
          <option value="active">{t('Inaendelea')}</option>
          <option value="inactive">{t('Haifanyi kazi')}</option>
          <option value="blacklisted">{t('Orodha Nyeusi')}</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Nambari ya Mteja')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Jina')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Simu')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('NIDA')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Hali')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Kiwango cha Hatari')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Vitendo')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers?.data?.results?.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.customer_no}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.first_name} {customer.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.nida_number || t('Haijatolewa')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${customer.status === 'active' ? 'bg-green-100 text-green-800' : customer.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                      {t(customer.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${customer.risk_level === 'low' ? 'bg-green-100 text-green-800' : customer.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {t(customer.risk_level)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button onClick={() => { setSelectedCustomer(customer); setShowForm(true); }} className="text-primary-600 hover:text-primary-900 mr-3">{t('Hariri')}</button>
                    <button onClick={() => { if (window.confirm(t('Una uhakika unataka kufuta mteja huyu?'))) { deleteMutation.mutate(customer.id); } }} className="text-red-600 hover:text-red-900">{t('Futa')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <CustomerForm onClose={() => { setShowForm(false); setSelectedCustomer(null); }} customer={selectedCustomer} />
      )}
    </div>
  );
};

export default Customers;