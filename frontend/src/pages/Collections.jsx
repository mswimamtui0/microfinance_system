import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loanAPI } from '../api';
import Loading from '../components/Common/Loading';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';

const Collections = () => {
  const [filter, setFilter] = useState('all');
  const [allSchedules, setAllSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  // Fetch all loans
  const { data: loans, isLoading: loansLoading, refetch } = useQuery({
    queryKey: ['all-loans'],
    queryFn: () => loanAPI.getAll({ limit: 1000 }),
  });

  // Fetch schedules for each loan
  useEffect(() => {
    const fetchAllSchedules = async () => {
      if (!loans?.data?.results) return [];
      
      const schedules = [];
      for (const loan of loans.data.results) {
        try {
          const response = await loanAPI.getSchedule(loan.id);
          const loanSchedules = response.data || [];
          loanSchedules.forEach(schedule => {
            schedules.push({
              ...schedule,
              loan: loan,
              customer: loan.customer_details || loan.customer || { first_name: 'Unknown', last_name: '' }
            });
          });
        } catch (error) {
          console.log(`No schedules for loan ${loan.loan_no}, creating fallback`);
          if (loan.status === 'active' || loan.status === 'disbursed') {
            schedules.push({
              id: `loan-${loan.id}`,
              installment_no: 1,
              due_date: loan.maturity_date || new Date().toISOString().split('T')[0],
              principal_amount: loan.principal || 0,
              interest_amount: loan.total_interest || 0,
              penalty_amount: 0,
              total_due: loan.outstanding_balance || loan.principal || 0,
              status: loan.is_overdue ? 'overdue' : 'pending',
              loan: loan,
              customer: loan.customer_details || loan.customer || { first_name: 'Unknown', last_name: '' }
            });
          }
        }
      }
      return schedules;
    };

    if (loans?.data?.results) {
      fetchAllSchedules().then(schedules => {
        setAllSchedules(schedules);
        setLoadingSchedules(false);
      });
    }
  }, [loans]);

  if (loansLoading || loadingSchedules) {
    return <Loading />;
  }

  // Date calculations - FIXED
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Helper function to check if a date is overdue
  const isDateOverdue = (dueDate) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Filter schedules based on selection
  const filteredSchedules = allSchedules.filter(item => {
    if (filter === 'today') {
      return item.due_date === todayStr;
    } else if (filter === 'tomorrow') {
      return item.due_date === tomorrowStr;
    } else if (filter === 'overdue') {
      return isDateOverdue(item.due_date) && item.status !== 'paid';
    } else if (filter === 'defaulted') {
      return item.loan?.status === 'defaulted';
    }
    return true;
  });

  // Calculate stats - FIXED
  const dueToday = allSchedules.filter(c => c.due_date === todayStr && c.status !== 'paid');
  const dueTomorrow = allSchedules.filter(c => c.due_date === tomorrowStr && c.status !== 'paid');
  const overdue = allSchedules.filter(c => isDateOverdue(c.due_date) && c.status !== 'paid');
  const defaulters = loans?.data?.results?.filter(l => l.status === 'defaulted') || [];

  const stats = [
    { 
      name: 'Due Today', 
      count: dueToday.length,
      total: dueToday.reduce((sum, c) => sum + (parseFloat(c.total_due) || 0), 0),
    },
    { 
      name: 'Due Tomorrow', 
      count: dueTomorrow.length,
      total: dueTomorrow.reduce((sum, c) => sum + (parseFloat(c.total_due) || 0), 0),
    },
    { 
      name: 'Overdue', 
      count: overdue.length,
      total: overdue.reduce((sum, c) => sum + (parseFloat(c.total_due) || 0), 0),
    },
    { 
      name: 'Defaulters', 
      count: defaulters.length,
      total: defaulters.reduce((sum, l) => sum + (parseFloat(l.outstanding_balance) || 0), 0),
    },
  ];

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Collections Dashboard</h1>
        <button onClick={() => refetch()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Refresh Data
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
            <p className="text-sm text-gray-500">{formatCurrency(stat.total)}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white p-3 rounded-lg border border-gray-200 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({allSchedules.length})
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'today' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Due Today ({dueToday.length})
        </button>
        <button
          onClick={() => setFilter('tomorrow')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'tomorrow' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Due Tomorrow ({dueTomorrow.length})
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'overdue' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Overdue ({overdue.length})
        </button>
        <button
          onClick={() => setFilter('defaulted')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'defaulted' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Defaulters ({defaulters.length})
        </button>
      </div>

      {/* Collections Table */}
      {filteredSchedules.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Penalty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchedules.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.customer?.first_name || 'Unknown'} {item.customer?.last_name || ''}
                      </div>
                      <div className="text-sm text-gray-500">{item.customer?.phone || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.loan?.loan_no || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{item.installment_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.due_date)}
                      {item.due_date === todayStr && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">Today</span>
                      )}
                      {isDateOverdue(item.due_date) && item.status !== 'paid' && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">Overdue</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      {formatCurrency(item.total_due || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                      {formatCurrency(item.penalty_amount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                      {formatCurrency((parseFloat(item.total_due) || 0) + (parseFloat(item.penalty_amount) || 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        to={`/payments/new?loan=${item.loan?.id}`}
                        className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                      >
                        Receive
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No collection records found.</p>
          <p className="text-sm text-gray-400 mt-2">Make sure you have active loans with repayment schedules.</p>
        </div>
      )}
    </div>
  );
};

export default Collections;