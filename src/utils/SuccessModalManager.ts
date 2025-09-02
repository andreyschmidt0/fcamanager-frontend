class SuccessModalManager {
  private static instance: SuccessModalManager;
  private showSuccessCallback?: (title?: string, message?: string) => void;

  private constructor() {}

  static getInstance(): SuccessModalManager {
    if (!SuccessModalManager.instance) {
      SuccessModalManager.instance = new SuccessModalManager();
    }
    return SuccessModalManager.instance;
  }

  setShowSuccessCallback(callback: (title?: string, message?: string) => void): void {
    this.showSuccessCallback = callback;
  }

  showSuccess(title?: string, message?: string): void {
    if (this.showSuccessCallback) {
      this.showSuccessCallback(title, message);
    }
  }
}

export default SuccessModalManager;