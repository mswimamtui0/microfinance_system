import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import Loading from '../Common/Loading';
import { reportAPI, loanAPI, customerAPI, paymentAPI } from '../../api';

// Register ChartJS components with Filler
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
);

const AdminDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [dateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio-report', dateRange],
    queryFn: () => reportAPI.getPortfolio(dateRange),
  });

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ['recent-loans'],
    queryFn: () => loanAPI.getAll({ limit: 10 }),
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['recent-customers'],
    queryFn: () => customerAPI.getAll({ limit: 10 }),
  });

  const { data: paymentSummary } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: () => paymentAPI.getSummary(),
  });

  if (portfolioLoading || loansLoading || customersLoading) {
    return <Loading />;
  }

  const stats = [
    {
      name: t('Total Portfolio'),
      value: formatCurrency(portfolio?.data?.total_portfolio || 0),
      change: '+12.5%',
      changeType: 'positive',
      color: '#0ea5e9',
    },
    {
      name: t('Active Loans'),
      value: portfolio?.data?.active_loans || 0,
      change: '+5.2%',
      changeType: 'positive',
      color: '#22c55e',
    },
    {
      name: t('Total Customers'),
      value: portfolio?.data?.total_customers || 0,
      change: '+8.1%',
      changeType: 'positive',
      color: '#8b5cf6',
    },
    {
      name: t('Total Branches'),
      value: 5,
      change: '0%',
      changeType: 'neutral',
      color: '#f59e0b',
    },
    {
      name: t('Collection Rate'),
      value: `${portfolio?.data?.collection_rate || 0}%`,
      change: portfolio?.data?.collection_rate > 85 ? '+3.2%' : '-2.1%',
      changeType: portfolio?.data?.collection_rate > 85 ? 'positive' : 'negative',
      color: '#6366f1',
    },
    {
      name: t('Overdue Loans'),
      value: portfolio?.data?.overdue_loans || 0,
      change: '-2.5%',
      changeType: 'positive',
      color: '#ef4444',
    },
  ];

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: t('Disbursements'),
        data: [12000000, 15000000, 18000000, 22000000, 25000000, 30000000, 28000000, 35000000, 32000000, 38000000, 40000000, 45000000],
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        borderColor: 'rgb(14, 165, 233)',
        borderWidth: 2,
        fill: false,
      },
      {
        label: t('Collections'),
        data: [8000000, 10000000, 12000000, 15000000, 18000000, 22000000, 25000000, 28000000, 30000000, 32000000, 35000000, 38000000],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  const doughnutData = {
    labels: [t('Performing'), t('Overdue'), t('Defaulted')],
    datasets: [
      {
        data: [portfolio?.data?.performing || 75, portfolio?.data?.overdue_rate || 15, portfolio?.data?.default_rate || 10],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const lineData = {
    labels: [t('Week 1'), t('Week 2'), t('Week 3'), t('Week 4')],
    datasets: [
      {
        label: t('New Customers'),
        data: [12, 19, 15, 22],
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: t('New Loans'),
        data: [8, 12, 10, 18],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const quickActions = [
    { 
      name: t('Manage Users'), 
      href: 'https://microfinance-system-df49.onrender.com/admin/auth/user/', 
      color: '#8b5cf6' 
    },
    { 
      name: t('System Settings'), 
      href: 'https://microfinance-system-df49.onrender.com/admin/', 
      color: '#6b7280' 
    },
    { 
      name: t('Audit Logs'), 
      href: 'https://microfinance-system-df49.onrender.com/admin/audit/auditlog/', 
      color: '#6b7280' 
    },
    { 
      name: t('Export Reports'), 
      href: '#', 
      color: '#22c55e',
      onClick: () => alert(t('Reports export coming soon!'))
    },
    { 
      name: t('Manage Branches'), 
      href: 'https://microfinance-system-df49.onrender.com/admin/branches/branch/', 
      color: '#0ea5e9' 
    },
    { 
      name: t('New Loan'), 
      href: '/loans/new', 
      color: '#0ea5e9',
      internal: true 
    },
  ];

  const adminActions = [
    { 
      name: t('Add Loan Product'), 
      href: 'https://microfinance-system-df49.onrender.com/admin/loans/loanproduct/add/', 
      color: '#10b981' 
    },
    { 
      name: t('View Loan Products'), 
      href: 'https://microfinance-system-df49.onrender.com/admin/loans/loanproduct/', 
      color: '#3b82f6' 
    },
    { 
      name: t('View Customers'), 
      href: 'https://microfinance-system-df49.onrender.com/admin/customers/customer/', 
      color: '#8b5cf6' 
    },
    { 
      name: t('View All Loans'), 
      href: 'https://microfinance-system-df49.onrender.com/admin/loans/loan/', 
      color: '#ef4444' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white'
      }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {t('Welcome')}, {user?.first_name || user?.username}!
            </h1>
            <p style={{ opacity: 0.9, marginTop: '4px' }}>
              {t('System Administrator')} • {t('Full System Access')}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '12px' }}>
                {t('Super Admin')}
              </span>
              <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '12px' }}>
                {t('All Branches')}
              </span>
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button style={{ padding: '8px 16px', background: 'white', color: '#0369a1', borderRadius: '8px', border: 'none', fontWeight: '500', cursor: 'pointer' }}>
              {t('Export System Report')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
            <p style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>{stat.name}</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginTop: '4px' }}>
              {stat.value}
            </p>
            <span style={{
              fontSize: '11px',
              color: stat.changeType === 'positive' ? '#22c55e' : stat.changeType === 'negative' ? '#ef4444' : '#6b7280'
            }}>
              {stat.change}
            </span>
          </div>
        ))}
      </div>

      {/* Loan Products Quick Access - Admin Only */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{t('Loan Products')}</h3>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            <a 
              href="https://microfinance-system-df49.onrender.com/admin/loans/loanproduct/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#0284c7', textDecoration: 'none' }}
            >
              {t('Manage Products')} →
            </a>
          </span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px'
        }}>
          {adminActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                textDecoration: 'none',
                color: '#374151',
                background: 'white',
                transition: 'background 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: action.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                {action.name.charAt(0)}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '500', marginTop: '8px', textAlign: 'center' }}>{action.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>{t('Quick Actions')}</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px'
        }}>
          {quickActions.map((action) => {
            if (action.internal) {
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: '#374151',
                    background: 'white',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: action.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}>
                    {action.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '500', marginTop: '8px', textAlign: 'center' }}>{action.name}</span>
                </Link>
              );
            }
            return (
              <a
                key={action.name}
                href={action.href}
                target={action.href !== '#' ? '_blank' : '_self'}
                rel="noopener noreferrer"
                onClick={action.onClick}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#374151',
                  background: 'white',
                  transition: 'background 0.2s',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: action.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  {action.name.charAt(0)}
                </div>
                <span style={{ fontSize: '12px', fontWeight: '500', marginTop: '8px', textAlign: 'center' }}>{action.name}</span>
                {action.href !== '#' && action.href !== '/loans/new' && (
                  <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                    ({t('Opens in new tab')})
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{t('Financial Performance')}</h3>
            <select style={{ padding: '4px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
              <option>{t('This Year')}</option>
              <option>{t('Last Year')}</option>
              <option>{t('Last 6 Months')}</option>
            </select>
          </div>
          <div style={{ height: '300px' }}>
            <Bar data={chartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: { font: { size: 12 } }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return 'TZS ' + (value / 1000000).toFixed(0) + 'M';
                    }
                  }
                }
              }
            }} />
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>{t('Portfolio Quality')}</h3>
          <div style={{ height: '250px' }}>
            <Doughnut data={doughnutData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 20,
                    font: { size: 12 }
                  }
                }
              }
            }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px', textAlign: 'center' }}>
            <div>
              <p style={{ fontWeight: '600', color: '#22c55e' }}>{portfolio?.data?.performing || 75}%</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>{t('Performing')}</p>
            </div>
            <div>
              <p style={{ fontWeight: '600', color: '#f59e0b' }}>{portfolio?.data?.overdue_rate || 15}%</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>{t('Overdue')}</p>
            </div>
            <div>
              <p style={{ fontWeight: '600', color: '#ef4444' }}>{portfolio?.data?.default_rate || 10}%</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>{t('Defaulted')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>{t('Growth Metrics')}</h3>
        <div style={{ height: '250px' }}>
          <Line data={lineData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: { font: { size: 12 } }
              }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }} />
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{t('Recent Loans')}</h3>
            <Link to="/loans" style={{ color: '#0284c7', fontSize: '14px' }}>{t('View All')} →</Link>
          </div>
          {loans?.data?.results?.slice(0, 5).map((loan) => (
            <div key={loan.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '8px'
            }}>
              <div>
                <p style={{ fontWeight: '500', fontSize: '14px' }}>{loan.loan_no}</p>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                  {loan.customer_details?.first_name} {loan.customer_details?.last_name}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '600', fontSize: '14px' }}>{formatCurrency(loan.principal)}</p>
                <span style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  borderRadius: '20px',
                  background: loan.status === 'active' ? '#dcfce7' : '#fef3c7',
                  color: loan.status === 'active' ? '#166534' : '#92400e'
                }}>
                  {t(loan.status)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{t('Recent Customers')}</h3>
            <Link to="/customers" style={{ color: '#0284c7', fontSize: '14px' }}>{t('View All')} →</Link>
          </div>
          {customers?.data?.results?.slice(0, 5).map((customer) => (
            <div key={customer.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '8px',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  color: '#0284c7',
                  fontSize: '14px'
                }}>
                  {customer.first_name?.[0]}{customer.last_name?.[0]}
                </div>
                <div>
                  <p style={{ fontWeight: '500', fontSize: '14px' }}>{customer.first_name} {customer.last_name}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>{customer.phone}</p>
                </div>
              </div>
              <span style={{
                padding: '2px 8px',
                fontSize: '11px',
                borderRadius: '20px',
                background: customer.status === 'active' ? '#dcfce7' : '#fef3c7',
                color: customer.status === 'active' ? '#166534' : '#92400e'
              }}>
                {t(customer.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>{t('System Status')}</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{t('API: Online')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{t('Database: Connected')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#fefce8', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{t('Backup: 2 hours ago')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{t('Users Online: 12')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;