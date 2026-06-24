import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/formatters';

const CustomerLoans = () => {
  // Sample data - will be replaced with real API data
  const loans = [
    {
      id: 1,
      loan_no: 'LN-001',
      principal: 500000,
      outstanding_balance: 300000,
      status: 'active',
      maturity_date: '2026-12-01',
    },
    {
      id: 2,
      loan_no: 'LN-002',
      principal: 1000000,
      outstanding_balance: 700000,
      status: 'active',
      maturity_date: '2027-06-01',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Loans</h1>
            <Link to="/customer/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
              ← Back to Dashboard
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{loan.loan_no}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(loan.principal)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(loan.outstanding_balance)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        loan.status === 'active' ? 'bg-green-100 text-green-800' :
                        loan.status === 'paid' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(loan.maturity_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoans;