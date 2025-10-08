// Utility helper functions

export function showToast(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} fade-in`;
  toast.innerHTML = `
    <div class="p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'} text-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'}-500"></i>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-gray-900">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = function() {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function sanitizeHtml(str: string): string {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}