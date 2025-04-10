import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';

// This is a proper version of the AddTransaction component that fixes the parsing error
export default function AddTransaction({ onTransactionAdded }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: 'expense',
    category_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("You must be logged in to add transactions");
        return;
      }

      const parsedAmount = parseFloat(formData.amount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      if (!formData.category_id) {
        setError("Please select a category");
        return;
      }

      const { error } = await supabase.from("transactions").insert([
        {
          user_id: userData.user.id,
          type: formData.type,
          category_id: formData.category_id,
          amount: parsedAmount,
          description: formData.description,
          date: formData.date
        }
      ]);

      if (error) throw error;

      // Reset form
      setFormData({
        type: 'expense',
        category_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });

      // Notify parent component that a transaction was added
      if (onTransactionAdded) {
        onTransactionAdded();
      }

      // Refresh the transactions list
      router.refresh();
    } catch (error) {
      console.error("Error adding transaction:", error);
      setError(error.message || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg border shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select a category</option>
              {/* Categories would be populated here */}
              <option value="groceries">Groceries</option>
              <option value="utilities">Utilities</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              placeholder="What was this for?"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white p-3 rounded-md hover:bg-primary/90 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <PlusCircle size={16} />
                Add Transaction
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 