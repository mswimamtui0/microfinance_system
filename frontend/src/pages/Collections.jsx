import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loanAPI } from '../api';
import Loading from '../components/Common/Loading';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';

const Collections = () => {
  const [filter, setFilter] = useState('all');
  
  const { data: loans, isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: () => loanAPI.getAll({ limit: 1000 }),
  });

  if (isLoading) return <Loading />;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const allLoans = loans?.data?.results || [];
  
  // Get all schedules from loans
  const allSchedules = [];
  allLoans.forEach(loan => {
    if (loan.schedules) {
      loan.schedules.forEach(schedule => {
        if (schedule.status === 'pending' || schedule.status === 'overdue' || schedule.status === 'partial') {
          allSchedules.push({
            ...schedule,
            loan: loan,
            customer: loan.customer_details
          });
        }
      });
    }
  });

  const filteredSchedules = allSchedules.filter(item => {
    if (filter === 'today') {
      return item.due_date === todayStr;
    } else if (filter === 'tomorrow') {
      return item.due_date === tomorrowStr;
    } else if (filter === 'overdue') {
      return item.status === 'overdue';
    } else if (filter === 'defaulted') {
      return item.loan?.status === 'defaulted';
    }
    return true;
  });

  const stats = [
    { 
      name: 'Due Today', 
      count: allSchedules.filter(c => c.due_date === todayStr).length, 
      color: '#f59e0b',
      icon: '📅'
    },
    { 
      name: 'Due Tomorrow', 
      count: allSchedules.filter(c => c.due_date === tomorrowStr).length, 
      color: '#3b82f6',
      icon: '📆'
    },
    { 
      name: 'Overdue', 
      count: allSchedules.filter(c => c.status === 'overdue').length, 
      color: '#ef4444',
      icon: '⚠️'
    },
    { 
      name: 'Defaulters', 
      count: allLoans.filter(l => l.status === 'defaulted').length, 
      color: '#dc2626',
      icon: '🚫'
    },
  ];

  const totalDueToday = allSchedules
    .filter(c => c.due_date === todayStr)
    .reduce((sum, c) => sum + c.total_due, 0);

  const totalOverdue = allSchedules
    .filter(c => c.status === 'overdue')
    .reduce((sum, c) => sum + c.total_due, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Collections</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        {stats.map((stat) => (
          <div key={stat.name} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>{stat.name}</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{stat.count}</p>
              </div>
              <span style={{ fontSize: '32px' }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Collection Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Total Due Today</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{formatCurrency(totalDueToday)}</p>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Total Overdue Amount</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{formatCurrency(totalOverdue)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        background: 'white',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'all' ? '#0284c7' : 'transparent',
            color: filter === 'all' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          All Collections
        </button>
        <button
          onClick={() => setFilter('today')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'today' ? '#f59e0b' : 'transparent',
            color: filter === 'today' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Due Today
        </button>
        <button
          onClick={() => setFilter('tomorrow')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'tomorrow' ? '#3b82f6' : 'transparent',
            color: filter === 'tomorrow' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Due Tomorrow
        </button>
        <button
          onClick={() => setFilter('overdue')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'overdue' ? '#ef4444' : 'transparent',
            color: filter === 'overdue' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Overdue
        </button>
        <button
          onClick={() => setFilter('defaulted')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'defaulted' ? '#dc2626' : 'transparent',
            color: filter === 'defaulted' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Defaulters
        </button>
      </div>

      {/* Collections Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Customer</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Loan</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Installment</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Due Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: '500' }}>
                      {item.customer?.first_name} {item.customer?.last_name}
                    </span>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.customer?.phone}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                    {item.loan?.loan_no}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                    #{item.installment_no} of {item.loan?.term_months || 0}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {formatDate(item.due_date)}
                    {item.due_date === todayStr && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        background: '#fef3c7',
                        borderRadius: '12px',
                        fontSize: '10px',
                        color: '#d97706'
                      }}>
                        Today
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>
                    {formatCurrency(item.total_due)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: item.status === 'overdue' ? '#fef2f2' : 
                                 item.status === 'partial' ? '#eff6ff' : '#fef3c7',
                      color: item.status === 'overdue' ? '#dc2626' : 
                             item.status === 'partial' ? '#2563eb' : '#d97706'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <Link
                      to={`/payments/new?loan=${item.loan?.id}`}
                      style={{
                        padding: '6px 16px',
                        background: '#0284c7',
                        color: 'white',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        display: 'inline-block'
                      }}
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
    </div>
  );
};

export default Collections;