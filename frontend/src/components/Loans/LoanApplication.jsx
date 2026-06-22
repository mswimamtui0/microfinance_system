import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loanAPI } from '../../api';
import toast from 'react-hot-toast';

const LoanApplication = ({ onClose, products, customers }) => {
  const [formData, setFormData] = useState({
    customer: '',
    product: '',
    principal: '',
    term_months: '',
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const queryClient = useQueryClient();

  const createLoanMutation = useMutation({
    mutationFn: async (data) => {
      console.log('📤 Sending loan data:', data);
      const response = await loanAPI.create(data);
      console.log('📥 Loan creation response:', response);
      return response;
    },
    onSuccess: (response) => {
      console.log('✅ Loan created successfully:', response.data);
      queryClient.invalidateQueries(['loans']);
      toast.success('Loan application submitted successfully');
      onClose();
    },
    onError: (error) => {
      console.error('❌ Loan creation error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          error.response?.data?.detail ||
                          'Failed to create loan. Please check all fields and try again.';
      toast.error(errorMessage);
    },
  });

  const handleProductChange = (e) => {
    const productId = parseInt(e.target.value);
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product);
    setFormData({ ...formData, product: productId });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.customer) {
      toast.error('Please select a customer');
      return;
    }
    if (!formData.product) {
      toast.error('Please select a loan product');
      return;
    }
    if (!formData.principal || parseFloat(formData.principal) <= 0) {
      toast.error('Please enter a valid principal amount');
      return;
    }
    if (!formData.term_months || parseInt(formData.term_months) <= 0) {
      toast.error('Please enter a valid term');
      return;
    }

    // Validate against product limits
    if (selectedProduct) {
      const principal = parseFloat(formData.principal);
      if (principal < selectedProduct.min_amount) {
        toast.error(`Minimum amount is TZS ${selectedProduct.min_amount.toLocaleString()}`);
        return;
      }
      if (principal > selectedProduct.max_amount) {
        toast.error(`Maximum amount is TZS ${selectedProduct.max_amount.toLocaleString()}`);
        return;
      }
      const term = parseInt(formData.term_months);
      if (term < selectedProduct.min_term_months) {
        toast.error(`Minimum term is ${selectedProduct.min_term_months} months`);
        return;
      }
      if (term > selectedProduct.max_term_months) {
        toast.error(`Maximum term is ${selectedProduct.max_term_months} months`);
        return;
      }
    }

    // Prepare data for API - ensure numeric values
    const loanData = {
      customer: parseInt(formData.customer),
      product: parseInt(formData.product),
      principal: parseFloat(formData.principal),
      term_months: parseInt(formData.term_months),
    };

    console.log('📤 Submitting loan data:', loanData);
    createLoanMutation.mutate(loanData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">New Loan Application</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                required
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Customer</option>
                {customers?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name} - {customer.customer_no}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Product *
              </label>
              <select
                required
                value={formData.product}
                onChange={handleProductChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Product</option>
                {products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name} - {product.interest_rate}% ({product.interest_method})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Details */}
            {selectedProduct && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Product Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Min Amount:</span>
                    <span className="ml-2 font-medium">TZS {selectedProduct.min_amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Amount:</span>
                    <span className="ml-2 font-medium">TZS {selectedProduct.max_amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Interest Rate:</span>
                    <span className="ml-2 font-medium">{selectedProduct.interest_rate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Term Range:</span>
                    <span className="ml-2 font-medium">{selectedProduct.min_term_months} - {selectedProduct.max_term_months} months</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Repayment Frequency:</span>
                    <span className="ml-2 font-medium capitalize">{selectedProduct.repayment_frequency}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Principal Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principal Amount (TZS) *
              </label>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                value={formData.principal}
                onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter loan amount"
              />
              {selectedProduct && (
                <p className="mt-1 text-sm text-gray-500">
                  Amount must be between TZS {selectedProduct.min_amount.toLocaleString()} and TZS {selectedProduct.max_amount.toLocaleString()}
                </p>
              )}
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term (Months) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="36"
                value={formData.term_months}
                onChange={(e) => setFormData({ ...formData, term_months: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter loan term in months"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoanMutation.isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoanMutation.isLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {createLoanMutation.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                {createLoanMutation.error.response?.data?.error || 
                 createLoanMutation.error.response?.data?.message ||
                 'Failed to create loan. Please try again.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;