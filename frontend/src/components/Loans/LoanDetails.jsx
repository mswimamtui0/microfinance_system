import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loanAPI } from '../../api';
import Loading from '../Common/Loading';
import { formatCurrency, formatDate } from '../../utils/formatters';

const LoanDetails = ({ loan, onClose }) => {
  const [realTimeStatus, setRealTimeStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['loan-schedule', loan.id],
    queryFn: () => loanAPI.getSchedule(loan.id),
  });

  const { data: loanSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['loan-summary', loan.id],
    queryFn: () => loanAPI.getById(loan.id),
  });

  // Fetch real-time status
  useEffect(() => {
    const fetchRealTimeStatus = async () => {
      try {
        setIsLoading(true);
        const response = await loanAPI.getLoanRealTimeStatus(loan.id);
        console.log('Real-time status response:', response.data);
        setRealTimeStatus(response.data);
      } catch (error) {
        console.error('Error fetching real-time status:', error);
        // If the endpoint fails, try the regular loan details
        try {
          const loanResponse = await loanAPI.getById(loan.id);
          setRealTimeStatus(loanResponse.data);
        } catch (e) {
          console.error('Fallback also failed:', e);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRealTimeStatus();
    
    // Update every 10 seconds
    const interval = setInterval(fetchRealTimeStatus, 10000);
    return () => clearInterval(interval);
  }, [loan.id]);

  if (scheduleLoading || summaryLoading) {
    return <Loading />;
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLoanStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      disbursed: 'bg-purple-100 text-purple-800',
      active: 'bg-green-100 text-green-800',
      paid: 'bg-gray-100 text-gray-800',
      defaulted: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Safe format currency - show decimals for small amounts
  const safeFormatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'TZS 0.00';
    }
    if (amount < 1) {
      return `TZS ${amount.toFixed(4)}`;
    }
    return `TZS ${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Calculate real-time values if not provided by API
  const getRealTimeValues = () => {
    if (realTimeStatus && realTimeStatus.per_second !== undefined) {
      return {
        perSecond: realTimeStatus.per_second || 0,
        perMinute: realTimeStatus.per_minute || 0,
        perHour: realTimeStatus.per_hour || 0,
        perDay: realTimeStatus.per_day || 0,
        perWeek: (realTimeStatus.per_day || 0) * 7,
        perMonth: (realTimeStatus.per_day || 0) * 30,
        daysElapsed: realTimeStatus.time_elapsed?.days || 0,
        daysRemaining: realTimeStatus.days_remaining || 0,
        nextDue: realTimeStatus.next_due_date,
        isOverdue: realTimeStatus.is_overdue,
        daysOverdue: realTimeStatus.days_overdue || 0,
        penalty: realTimeStatus.penalty || 0,
        totalPayable: realTimeStatus.total_payable || 0,
        amountPaid: realTimeStatus.amount_paid || 0,
        outstanding: realTimeStatus.outstanding_balance || 0,
        totalDays: realTimeStatus.total_days || 0,
      };
    }
    
    // Calculate manually if API doesn't return values
    if (loan) {
      const today = new Date();
      const disbursed = loan.disbursement_date ? new Date(loan.disbursement_date) : null;
      const totalPayable = parseFloat(loan.total_payable) || 0;
      const totalDays = (loan.term_months || 0) * 30;
      
      let daysElapsed = 0;
      if (disbursed) {
        daysElapsed = Math.floor((today - disbursed) / (1000 * 60 * 60 * 24));
      }
      const daysRemaining = Math.max(0, totalDays - daysElapsed);
      
      const perDay = totalDays > 0 ? totalPayable / totalDays : 0;
      const perHour = perDay / 24;
      const perMinute = perHour / 60;
      const perSecond = perMinute / 60;
      
      // Find next due date
      let nextDue = null;
      if (loan.schedules && loan.schedules.length > 0) {
        const pending = loan.schedules.find(s => s.status === 'pending');
        if (pending) {
          nextDue = pending.due_date;
        }
      }
      
      return {
        perSecond,
        perMinute,
        perHour,
        perDay,
        perWeek: perDay * 7,
        perMonth: perDay * 30,
        daysElapsed,
        daysRemaining,
        nextDue,
        isOverdue: loan.is_overdue || false,
        daysOverdue: loan.days_overdue || 0,
        penalty: 0,
        totalPayable,
        amountPaid: loan.amount_paid || 0,
        outstanding: loan.outstanding_balance || 0,
        totalDays,
      };
    }
    
    return {
      perSecond: 0,
      perMinute: 0,
      perHour: 0,
      perDay: 0,
      perWeek: 0,
      perMonth: 0,
      daysElapsed: 0,
      daysRemaining: 0,
      nextDue: null,
      isOverdue: false,
      daysOverdue: 0,
      penalty: 0,
      totalPayable: 0,
      amountPaid: 0,
      outstanding: 0,
      totalDays: 0,
    };
  };

  const realTime = getRealTimeValues();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Loan Details - {loan.loan_no}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              Close
            </button>
          </div>

          {/* Loan Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium text-gray-900">
                {loan.customer_details?.first_name} {loan.customer_details?.last_name}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Principal</p>
              <p className="font-medium text-gray-900">{safeFormatCurrency(loan.principal)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Outstanding Balance</p>
              <p className="font-medium text-gray-900">{safeFormatCurrency(loan.outstanding_balance)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Status</p>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLoanStatusColor(loan.status)}`}>
                {loan.status}
              </span>
            </div>
          </div>

          {/* Real-Time Status */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3">Real-Time Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Per Second:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {safeFormatCurrency(realTime.perSecond)}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Per Minute:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {safeFormatCurrency(realTime.perMinute)}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Per Hour:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {safeFormatCurrency(realTime.perHour)}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Per Day:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {safeFormatCurrency(realTime.perDay)}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Per Week:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {safeFormatCurrency(realTime.perWeek)}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Per Month:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {safeFormatCurrency(realTime.perMonth)}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Days Elapsed:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {realTime.daysElapsed} days
                </span>
              </div>
              <div>
                <span className="text-blue-700">Days Remaining:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {realTime.daysRemaining} days
                </span>
              </div>
              <div>
                <span className="text-blue-700">Next Due:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {realTime.nextDue ? formatDate(realTime.nextDue) : '-'}
                </span>
              </div>
              {realTime.isOverdue && (
                <div className="col-span-2 md:col-span-3 text-red-600 font-medium">
                  Overdue by {realTime.daysOverdue} days | Penalty: {safeFormatCurrency(realTime.penalty)}
                </div>
              )}
            </div>
            {isLoading && (
              <div className="text-xs text-blue-500 mt-2">Updating...</div>
            )}
          </div>

          {/* Loan Info */}
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
            <div>
              <span className="text-gray-500">Total Interest:</span>
              <span className="ml-2 font-medium">{safeFormatCurrency(loan.total_interest)}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Payable:</span>
              <span className="ml-2 font-medium">{safeFormatCurrency(loan.total_payable)}</span>
            </div>
            <div>
              <span className="text-gray-500">Disbursed:</span>
              <span className="ml-2 font-medium">{formatDate(loan.disbursement_date)}</span>
            </div>
            <div>
              <span className="text-gray-500">Maturity:</span>
              <span className="ml-2 font-medium">{formatDate(loan.maturity_date)}</span>
            </div>
          </div>

          {/* Repayment Schedule */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Repayment Schedule</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Due</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedule?.data?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.installment_no}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.due_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{safeFormatCurrency(item.principal_amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{safeFormatCurrency(item.interest_amount)}</td>
                      <td className="px-4 py-3 text-sm text-red-600">{safeFormatCurrency(item.penalty_amount)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{safeFormatCurrency(item.total_due)}</td>
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

          {/* Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
            {loan.status === 'pending' && (
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Approve
              </button>
            )}
            {loan.status === 'approved' && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Disburse
              </button>
            )}
            {loan.status === 'active' && (
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Record Payment
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetails;