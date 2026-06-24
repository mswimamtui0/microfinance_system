import React from 'react';
import { Link } from 'react-router-dom';

const CustomerApplyLoan = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Apply for Loan</h1>
          <p className="text-gray-600 mb-6">Fill in the form below to apply for a new loan.</p>
          
          {/* Loan Application Form - Coming Soon */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-700">Loan application form will be available soon.</p>
            <Link to="/customer/dashboard" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerApplyLoan;