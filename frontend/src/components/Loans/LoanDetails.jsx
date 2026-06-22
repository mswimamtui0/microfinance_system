import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { loanAPI } from '../../api';
import Loading from '../Common/Loading';

const LoanDetails = ({ loan, onClose }) => {
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['loan-schedule', loan.id],
    queryFn: () => loanAPI.getSchedule(loan.id),
  });

  if (isLoading) return <Loading />;

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Loan Details - {loan.loan_no}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium text-gray-900">
                {loan.customer_details?.first_name} {loan.customer_details?.last_name}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Principal</p>
              <p className="font-medium text-gray-900">TZS {loan.principal.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Outstanding Balance</p>
              <p className="font-medium text-gray-900">TZS {loan.outstanding_balance.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Status</p>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                {loan.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <span className="text-gray-500">Product:</span>
              <span className="ml-2 font-medium">{loan.product_details?.product_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Interest Rate:</span>
              <span className="ml-2 font-medium">{loan.interest_rate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Term:</span>
              <span className="ml-2 font-medium">{loan.term_months} months</span>
            </div>
            <div>
              <span className="text-gray-500">Frequency:</span>
              <span className="ml-2 font-medium capitalize">{loan.repayment_frequency}</span>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Repayment Schedule</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Due</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedule?.data?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.installment_no}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{new Date(item.due_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">TZS {item.principal_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">TZS {item.interest_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">TZS {item.total_due.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetails;