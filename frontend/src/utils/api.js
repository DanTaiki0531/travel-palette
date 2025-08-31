// APIクライアント関数
const API_BASE_URL = 'http://localhost:3001/api';

// 認証トークンを取得
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// 認証ヘッダーを含むリクエストヘッダーを作成
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// スポット関連のAPI
export const spotAPI = {
  // スポット一覧取得
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/spots`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('スポット取得に失敗しました');
    }
    return response.json();
  },

  // スポット追加
  create: async (spotData) => {
    const formData = new FormData();
    Object.keys(spotData).forEach(key => {
      if (spotData[key] !== null && spotData[key] !== undefined) {
        formData.append(key, spotData[key]);
      }
    });

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/spots`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('スポット追加に失敗しました');
    }
    return response.json();
  },

  // スポット削除
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/spots/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('スポット削除に失敗しました');
    }
    return response.json();
  }
};

// 行程関連のAPI
export const itineraryAPI = {
  // 行程一覧取得
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/itinerary`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('行程取得に失敗しました');
    }
    return response.json();
  },

  // 行程追加
  create: async (itemData) => {
    const response = await fetch(`${API_BASE_URL}/itinerary`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData)
    });
    if (!response.ok) {
      throw new Error('行程追加に失敗しました');
    }
    return response.json();
  },

  // 行程完了状態更新
  updateCompleted: async (id, completed) => {
    const response = await fetch(`${API_BASE_URL}/itinerary/${id}/complete`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ completed })
    });
    if (!response.ok) {
      throw new Error('行程更新に失敗しました');
    }
    return response.json();
  },

  // 行程削除
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/itinerary/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('行程削除に失敗しました');
    }
    return response.json();
  }
};

// 認証関連のAPI
export const authAPI = {
  // ログイン
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  },

  // 登録
  register: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  },

  // プロフィール取得
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('プロフィール取得に失敗しました');
    }
    return response.json();
  },

  // ユーザー名重複チェック
  checkUsername: async (username) => {
    const response = await fetch(`${API_BASE_URL}/auth/check-username/${username}`);
    if (!response.ok) {
      throw new Error('ユーザー名チェックに失敗しました');
    }
    return response.json();
  }
};
