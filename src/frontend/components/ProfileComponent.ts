import type { User } from '../types';
import { ApiService } from '../services/ApiService';

export class ProfileComponent {
  private currentUser: User | null;
  private currentView: string;

  constructor(currentUser: User | null) {
    this.currentUser = currentUser;
    this.currentView = 'personal';
  }

  render(container: HTMLElement, view: string = 'personal'): void {
    if (!container) return;

    this.currentView = view;

    switch (view) {
      case 'personal':
        this.renderPersonalInfo(container);
        break;
      case 'security':
        this.renderSecuritySettings(container);
        break;
      case 'preferences':
        this.renderPreferences(container);
        break;
      default:
        this.renderPersonalInfo(container);
    }
  }

  private renderPersonalInfo(container: HTMLElement): void {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-id-card mr-3 text-primary-600"></i>
            個人情報
          </h1>
          <p class="mt-2 text-gray-600">
            あなたのプロフィール情報を管理します
          </p>
        </div>

        <!-- Profile Form -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <form id="profile-form" class="space-y-6">
            <!-- Profile Picture Section -->
            <div class="flex items-center space-x-6">
              <div class="shrink-0">
                <img class="h-20 w-20 rounded-full object-cover bg-gray-200" 
                     src="${this.currentUser?.avatar || '/static/default-avatar.svg'}" 
                     alt="Profile Picture" 
                     id="profile-avatar">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  プロフィール画像
                </label>
                <input type="file" 
                       id="avatar-input" 
                       accept="image/*" 
                       class="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100">
              </div>
            </div>

            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="first-name" class="block text-sm font-medium text-gray-700 mb-2">
                  名前 <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       id="first-name" 
                       value="${this.currentUser?.name || ''}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>

              <div>
                <label for="last-name" class="block text-sm font-medium text-gray-700 mb-2">
                  姓
                </label>
                <input type="text" 
                       id="last-name" 
                       value="${this.currentUser?.lastName || ''}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>
            </div>

            <!-- Contact Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span class="text-red-500">*</span>
                </label>
                <input type="email" 
                       id="email" 
                       value="${this.currentUser?.email || ''}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>

              <div>
                <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input type="tel" 
                       id="phone" 
                       value="${this.currentUser?.phone || ''}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>
            </div>

            <!-- Additional Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="company" class="block text-sm font-medium text-gray-700 mb-2">
                  会社名
                </label>
                <input type="text" 
                       id="company" 
                       value="${this.currentUser?.company || ''}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>

              <div>
                <label for="department" class="block text-sm font-medium text-gray-700 mb-2">
                  部署
                </label>
                <input type="text" 
                       id="department" 
                       value="${this.currentUser?.department || ''}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>
            </div>

            <!-- Bio -->
            <div>
              <label for="bio" class="block text-sm font-medium text-gray-700 mb-2">
                自己紹介
              </label>
              <textarea id="bio" 
                        rows="4" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="あなたについて簡単に教えてください...">${this.currentUser?.bio || ''}</textarea>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <button type="button" 
                      onclick="this.resetForm()" 
                      class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <i class="fas fa-undo mr-2"></i>
                リセット
              </button>
              <button type="submit" 
                      class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                <i class="fas fa-save mr-2"></i>
                保存
              </button>
            </div>
          </form>
        </div>

        <!-- Account Information -->
        <div class="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">アカウント情報</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">ユーザーID:</span>
              <span class="ml-2 font-mono text-gray-900">${this.currentUser?.id || 'N/A'}</span>
            </div>
            <div>
              <span class="text-gray-600">アカウント作成日:</span>
              <span class="ml-2 text-gray-900">${this.currentUser?.createdAt ? new Date(this.currentUser.createdAt).toLocaleDateString('ja-JP') : 'N/A'}</span>
            </div>
            <div>
              <span class="text-gray-600">最終ログイン:</span>
              <span class="ml-2 text-gray-900">${this.currentUser?.lastLogin ? new Date(this.currentUser.lastLogin).toLocaleString('ja-JP') : 'N/A'}</span>
            </div>
            <div>
              <span class="text-gray-600">ロール:</span>
              <span class="ml-2">
                ${this.currentUser?.roles?.map(role => {
                  const roleLabels: Record<string, string> = {
                    'super_admin': '管理者',
                    'tenant_owner': 'テナント運営者',
                    'user': '利用者'
                  };
                  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">${roleLabels[role] || role}</span>`;
                }).join(' ') || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderSecuritySettings(container: HTMLElement): void {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-shield-alt mr-3 text-primary-600"></i>
            セキュリティ設定
          </h1>
          <p class="mt-2 text-gray-600">
            アカウントのセキュリティを管理します
          </p>
        </div>

        <!-- Password Change -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">パスワード変更</h3>
          <form id="password-form" class="space-y-4">
            <div>
              <label for="current-password" class="block text-sm font-medium text-gray-700 mb-2">
                現在のパスワード <span class="text-red-500">*</span>
              </label>
              <input type="password" 
                     id="current-password" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            </div>
            <div>
              <label for="new-password" class="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード <span class="text-red-500">*</span>
              </label>
              <input type="password" 
                     id="new-password" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <p class="mt-1 text-xs text-gray-600">
                8文字以上で、大文字、小文字、数字を含む必要があります
              </p>
            </div>
            <div>
              <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-2">
                パスワード確認 <span class="text-red-500">*</span>
              </label>
              <input type="password" 
                     id="confirm-password" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            </div>
            <div class="flex justify-end">
              <button type="submit" 
                      class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                <i class="fas fa-key mr-2"></i>
                パスワードを更新
              </button>
            </div>
          </form>
        </div>

        <!-- Two-Factor Authentication -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">二段階認証</h3>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-700">アカウントのセキュリティを強化するために二段階認証を設定します</p>
              <p class="text-sm text-gray-600 mt-1">
                現在のステータス: 
                <span class="text-red-600 font-medium">無効</span>
              </p>
            </div>
            <button class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              <i class="fas fa-mobile-alt mr-2"></i>
              有効にする
            </button>
          </div>
        </div>

        <!-- Session Management -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">セッション管理</h3>
          <p class="text-gray-700 mb-4">他のデバイスでのアクティブなセッションを管理します</p>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center">
                <i class="fas fa-laptop text-green-600 mr-3"></i>
                <div>
                  <p class="font-medium text-gray-900">現在のセッション</p>
                  <p class="text-sm text-gray-600">Chrome on Windows • 現在</p>
                </div>
              </div>
              <span class="text-green-600 text-sm font-medium">アクティブ</span>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div class="flex items-center">
                <i class="fas fa-mobile-alt text-gray-600 mr-3"></i>
                <div>
                  <p class="font-medium text-gray-900">iPhone Safari</p>
                  <p class="text-sm text-gray-600">2時間前</p>
                </div>
              </div>
              <button class="text-red-600 text-sm font-medium hover:text-red-800">
                終了
              </button>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t">
            <button class="text-red-600 hover:text-red-800 font-medium">
              <i class="fas fa-sign-out-alt mr-2"></i>
              すべてのセッションを終了
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachSecurityEventListeners();
  }

  private renderPreferences(container: HTMLElement): void {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-user-cog mr-3 text-primary-600"></i>
            設定
          </h1>
          <p class="mt-2 text-gray-600">
            あなたの使用設定をカスタマイズします
          </p>
        </div>

        <!-- Language and Localization -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">言語と地域</h3>
          <div class="space-y-4">
            <div>
              <label for="language" class="block text-sm font-medium text-gray-700 mb-2">
                言語
              </label>
              <select id="language" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="ja">日本語</option>
                <option value="en">English</option>
                <option value="ko">한국어</option>
                <option value="zh">中文</option>
              </select>
            </div>
            <div>
              <label for="timezone" class="block text-sm font-medium text-gray-700 mb-2">
                タイムゾーン
              </label>
              <select id="timezone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Notification Preferences -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">通知設定</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">メール通知</p>
                <p class="text-sm text-gray-600">重要な更新やお知らせをメールで受信</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">プッシュ通知</p>
                <p class="text-sm text-gray-600">ブラウザでのプッシュ通知を受信</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">SMS通知</p>
                <p class="text-sm text-gray-600">緊急時のSMS通知を受信</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Display Preferences -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">表示設定</h3>
          <div class="space-y-4">
            <div>
              <label for="theme" class="block text-sm font-medium text-gray-700 mb-2">
                テーマ
              </label>
              <select id="theme" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="light">ライト</option>
                <option value="dark">ダーク</option>
                <option value="auto">システム設定に従う</option>
              </select>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">デンスモード</p>
                <p class="text-sm text-gray-600">コンパクトな表示でより多くの情報を表示</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t flex justify-end">
            <button class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
              <i class="fas fa-save mr-2"></i>
              設定を保存
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachPreferencesEventListeners();
  }

  private attachEventListeners(): void {
    // Profile form submission
    const profileForm = document.getElementById('profile-form') as HTMLFormElement;
    if (profileForm) {
      profileForm.addEventListener('submit', this.handleProfileSubmit.bind(this));
    }

    // Avatar upload
    const avatarInput = document.getElementById('avatar-input') as HTMLInputElement;
    if (avatarInput) {
      avatarInput.addEventListener('change', this.handleAvatarChange.bind(this));
    }
  }

  private attachSecurityEventListeners(): void {
    // Password form submission
    const passwordForm = document.getElementById('password-form') as HTMLFormElement;
    if (passwordForm) {
      passwordForm.addEventListener('submit', this.handlePasswordSubmit.bind(this));
    }
  }

  private attachPreferencesEventListeners(): void {
    // Auto-save preferences on change
    const preferences = ['language', 'timezone', 'theme'];
    preferences.forEach(pref => {
      const element = document.getElementById(pref);
      if (element) {
        element.addEventListener('change', this.handlePreferenceChange.bind(this));
      }
    });
  }

  private async handleProfileSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('name', (document.getElementById('first-name') as HTMLInputElement).value);
    formData.append('lastName', (document.getElementById('last-name') as HTMLInputElement).value);
    formData.append('email', (document.getElementById('email') as HTMLInputElement).value);
    formData.append('phone', (document.getElementById('phone') as HTMLInputElement).value);
    formData.append('company', (document.getElementById('company') as HTMLInputElement).value);
    formData.append('department', (document.getElementById('department') as HTMLInputElement).value);
    formData.append('bio', (document.getElementById('bio') as HTMLTextAreaElement).value);

    try {
      const response = await ApiService.updateUserProfile(formData);
      if (response.success) {
        this.showSuccessMessage('プロフィールが正常に更新されました');
      } else {
        this.showErrorMessage('プロフィールの更新に失敗しました');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      this.showErrorMessage('プロフィールの更新中にエラーが発生しました');
    }
  }

  private async handlePasswordSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const currentPassword = (document.getElementById('current-password') as HTMLInputElement).value;
    const newPassword = (document.getElementById('new-password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;

    if (newPassword !== confirmPassword) {
      this.showErrorMessage('新しいパスワードが一致しません');
      return;
    }

    try {
      const response = await ApiService.changePassword({
        currentPassword,
        newPassword
      });
      
      if (response.success) {
        this.showSuccessMessage('パスワードが正常に更新されました');
        // Clear form
        (document.getElementById('password-form') as HTMLFormElement).reset();
      } else {
        this.showErrorMessage('パスワードの更新に失敗しました');
      }
    } catch (error) {
      console.error('Password change error:', error);
      this.showErrorMessage('パスワードの更新中にエラーが発生しました');
    }
  }

  private handleAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const avatarImg = document.getElementById('profile-avatar') as HTMLImageElement;
        if (avatarImg && e.target?.result) {
          avatarImg.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  private handlePreferenceChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    console.log(`Preference ${target.id} changed to: ${target.value}`);
    // Auto-save preference
    this.savePreference(target.id, target.value);
  }

  private async savePreference(key: string, value: string): Promise<void> {
    try {
      await ApiService.updateUserPreference(key, value);
    } catch (error) {
      console.error('Failed to save preference:', error);
    }
  }

  private showSuccessMessage(message: string): void {
    // Create and show success toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50';
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-check-circle mr-2"></i>
        ${message}
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  private showErrorMessage(message: string): void {
    // Create and show error toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg z-50';
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-circle mr-2"></i>
        ${message}
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}