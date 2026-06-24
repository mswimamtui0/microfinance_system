import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentAPI } from '../../api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const PaymentForm = ({ onClose, loans, selectedLoan }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    loan: selectedLoan?.id || '',
    amount_paid: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  const [selectedLoanDetails, setSelectedLoanDetails] = useState(selectedLoan || null);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => paymentAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['loans']);
      toast.success(t('Malipo yamerekodiwa kikamilifu'));
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('Imeshindwa kurekodi malipo'));
    },
  });

  const handleLoanChange = (e) => {
    const loanId = e.target.value;
    const loan = loans.find(l => l.id === parseInt(loanId));
    setSelectedLoanDetails(loan);
    setFormData({ ...formData, loan: loanId });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.loan || !formData.amount_paid) {
      toast.error(t('Tafadhali chagua mkopo na weka kiasi'));
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('Rekodi Malipo')}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              {t('Funga')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Mkopo')} *</label>
              <select
                required
                value={formData.loan}
                onChange={handleLoanChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">{t('Chagua Mkopo')}</option>
                {loans?.map((loan) => (
                  <option key={loan.id} value={loan.id}>
                    {loan.loan_no} - {loan.customer?.first_name} {loan.customer?.last_name} - 
                    {t('Salio')}: TZS {loan.outstanding_balance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedLoanDetails && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">{t('Maelezo ya Mkopo')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('Salio')}:</span>
                    <span className="ml-2 font-medium">TZS {selectedLoanDetails.outstanding_balance.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('Kiasi cha Mkopo')}:</span>
                    <span className="ml-2 font-medium">TZS {selectedLoanDetails.principal.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('Kiwango cha Riba')}:</span>
                    <span className="ml-2 font-medium">{selectedLoanDetails.interest_rate}%</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Kiasi Kilicholipwa')} (TZS) *</label>
              <input
                type="number"
                required
                min="100"
                step="100"
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('Weka kiasi cha malipo')}
              />
              {selectedLoanDetails && (
                <p className="mt-1 text-sm text-gray-500">
                  {t('Kiasi cha juu ni')}: TZS {selectedLoanDetails.outstanding_balance.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Njia ya Malipo')} *</label>
              <select
                required
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="cash">{t('Pesa Taslimu')}</option>
                <option value="bank">{t('Uhamisho wa Benki')}</option>
                <option value="mpesa">{t('M-Pesa')}</option>
                <option value="airtel">{t('Airtel Money')}</option>
                <option value="cheque">{t('Cheki')}</option>
                <option value="other">{t('Nyingine')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Tarehe ya Malipo')} *</label>
              <input
                type="datetime-local"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Maelezo')}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('Maelezo ya hiari')}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                {t('Ghairi')}
              </button>
              <button type="submit" disabled={mutation.isLoading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50">
                {mutation.isLoading ? t('Inachakata...') : t('Rekodi Malipo')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;