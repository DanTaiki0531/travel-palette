import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ExpenseManager.css';

const ExpenseManager = ({ tripId, budget, onClose }) => {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchExpenses(),
        fetchCategories(),
        fetchSummary()
      ]);
    } catch (error) {
      console.error('Fetch data error:', error);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/expenses/trip/${tripId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Fetch expenses error:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/expenses/trip/${tripId}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/expenses/trip/${tripId}/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Fetch summary error:', error);
    }
  };

  const getFilteredExpenses = () => {
    if (selectedCategory === 'all') {
      return expenses;
    }
    return expenses.filter(expense => expense.category === selectedCategory);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      transportation: '🚗',
      accommodation: '🏨',
      food: '🍽️',
      entertainment: '🎪',
      shopping: '🛍️',
      other: '📋'
    };
    return icons[category] || icons.other;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      transportation: '交通費',
      accommodation: '宿泊費',
      food: '食費',
      entertainment: '娯楽費',
      shopping: '買い物',
      other: 'その他'
    };
    return labels[category] || category;
  };

  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const budgetUsage = budget ? (totalExpense / budget) * 100 : 0;

  if (loading) {
    return (
      <div className="expense-manager-overlay">
        <div className="expense-manager-content">
          <div className="loading">支出データを読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="expense-manager-overlay">
      <div className="expense-manager-content">
        <div className="expense-manager-header">
          <h2>💰 支出管理</h2>
          <div className="header-actions">
            <button 
              className="add-expense-btn"
              onClick={() => setShowAddForm(true)}
            >
              + 支出追加
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* 予算サマリー */}
        <div className="budget-summary">
          <div className="budget-card">
            <div className="budget-header">
              <h3>予算状況</h3>
              <span className={`budget-status ${budgetUsage > 100 ? 'over' : budgetUsage > 80 ? 'warning' : 'safe'}`}>
                {budgetUsage > 100 ? '予算超過' : budgetUsage > 80 ? '予算注意' : '予算内'}
              </span>
            </div>
            
            {budget ? (
              <div className="budget-details">
                <div className="budget-bar">
                  <div 
                    className="budget-progress" 
                    style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                  />
                </div>
                <div className="budget-text">
                  <span>¥{totalExpense.toLocaleString()} / ¥{budget.toLocaleString()}</span>
                  <span className="budget-percentage">{budgetUsage.toFixed(1)}%</span>
                </div>
                <div className="budget-remaining">
                  残り: ¥{Math.max(0, budget - totalExpense).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="no-budget">
                <p>予算が設定されていません</p>
                <p>合計支出: ¥{totalExpense.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* カテゴリ別サマリー */}
          <div className="category-summary">
            <h3>カテゴリ別支出</h3>
            <div className="category-list">
              {categories.map(cat => (
                <div key={cat.category} className="category-item">
                  <div className="category-info">
                    <span className="category-icon">{getCategoryIcon(cat.category)}</span>
                    <span className="category-name">{getCategoryLabel(cat.category)}</span>
                  </div>
                  <div className="category-amount">
                    <span className="amount">¥{cat.total_amount.toLocaleString()}</span>
                    <span className="count">({cat.count}件)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* フィルター */}
        <div className="expense-filters">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              すべて ({expenses.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.category}
                className={`filter-tab ${selectedCategory === cat.category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.category)}
              >
                {getCategoryIcon(cat.category)} {getCategoryLabel(cat.category)} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* 支出リスト */}
        <div className="expenses-container">
          {getFilteredExpenses().length === 0 ? (
            <div className="empty-expenses">
              <p>
                {selectedCategory === 'all' 
                  ? 'まだ支出が記録されていません'
                  : `${getCategoryLabel(selectedCategory)}の支出はありません`
                }
              </p>
              <button 
                className="add-first-expense-btn"
                onClick={() => setShowAddForm(true)}
              >
                最初の支出を記録
              </button>
            </div>
          ) : (
            <div className="expenses-list">
              {getFilteredExpenses()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(expense => (
                  <div key={expense.id} className="expense-item">
                    <div className="expense-header">
                      <div className="expense-info">
                        <span className="expense-category">{getCategoryIcon(expense.category)}</span>
                        <div className="expense-details">
                          <h4 className="expense-description">{expense.description}</h4>
                          <span className="expense-date">{formatDateTime(expense.date)}</span>
                        </div>
                      </div>
                      <div className="expense-amount">
                        ¥{expense.amount.toLocaleString()}
                      </div>
                    </div>

                    {expense.notes && (
                      <div className="expense-notes">
                        {expense.notes}
                      </div>
                    )}

                    {expense.receipt_image && (
                      <div className="expense-receipt">
                        <img 
                          src={`http://localhost:3001${expense.receipt_image}`} 
                          alt="レシート" 
                          className="receipt-thumbnail"
                        />
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {showAddForm && (
          <AddExpenseForm
            tripId={tripId}
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              fetchData();
            }}
          />
        )}
      </div>
    </div>
  );
};

// 支出追加フォーム
const AddExpenseForm = ({ tripId, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    currency: 'JPY'
  });
  const [receiptImage, setReceiptImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      formDataToSend.append('trip_id', tripId);
      formDataToSend.append('amount', parseFloat(formData.amount));
      
      if (receiptImage) {
        formDataToSend.append('receipt_image', receiptImage);
      }

      const response = await fetch('http://localhost:3001/api/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || '支出の追加に失敗しました');
      }
    } catch (error) {
      console.error('Add expense error:', error);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="add-form-overlay">
      <div className="add-form-content">
        <div className="add-form-header">
          <h3>新しい支出を記録</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="add-expense-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="description">支出内容 *</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="例：昼食、お土産、タクシー代など"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">金額 *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="例：1500"
                min="0"
                step="1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">カテゴリ *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="food">食費</option>
                <option value="transportation">交通費</option>
                <option value="accommodation">宿泊費</option>
                <option value="entertainment">娯楽費</option>
                <option value="shopping">買い物</option>
                <option value="other">その他</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date">日付 *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">メモ</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="支出の詳細や補足情報など..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="receipt_image">レシート画像</label>
            <input
              type="file"
              id="receipt_image"
              accept="image/*"
              onChange={(e) => setReceiptImage(e.target.files[0])}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              キャンセル
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? '記録中...' : '支出を記録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseManager;
