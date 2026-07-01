// coinState.ts
export type CoinResult = 'HEADS' | 'TAILS' | null;
export type TossingStatus = 'INITIAL' | 'TOSSING' | 'FINISHED';

// Coin state management class with event system
export class CoinStateManager {
  // Current tossing status
  private _status: TossingStatus = 'INITIAL';
  // Results of each coin (index 0, 1, 2)
  private _coinResults: CoinResult[] = [null, null, null];
  // Event listeners
  private _listeners: ((status: TossingStatus, results: CoinResult[]) => void)[] = [];

  // Get current status
  get status(): TossingStatus {
    return this._status;
  }

  // Get all coin results
  get coinResults(): CoinResult[] {
    return [...this._coinResults];
  }

  // Get a formatted string representation of the state
  get statusMessage(): string {
    switch (this._status) {
      case 'INITIAL':
        return '点击任意硬币开始翻转';
      case 'TOSSING':
        return '硬币翻转中...';
      case 'FINISHED':
        return this._coinResults
          .map((result, index) => `硬币${index + 1}: ${result}`)
          .join(' | ');
      default:
        return '';
    }
  }

  // Start tossing
  startTossing(): void {
    this._status = 'TOSSING';
    this._coinResults = [null, null, null];
    this._notifyListeners();
  }

  // Set results and finish tossing
  setResults(results: CoinResult[]): void {
    this._coinResults = [...results];
    this._status = 'FINISHED';
    this._notifyListeners();
  }

  // Reset to initial state
  reset(): void {
    this._status = 'INITIAL';
    this._coinResults = [null, null, null];
    this._notifyListeners();
  }

  // Add state change listener
  addListener(callback: (status: TossingStatus, results: CoinResult[]) => void): void {
    this._listeners.push(callback);
  }

  // Remove listener
  removeListener(callback: (status: TossingStatus, results: CoinResult[]) => void): void {
    this._listeners = this._listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  private _notifyListeners(): void {
    this._listeners.forEach(listener => listener(this._status, this._coinResults));
  }
}

// Create and export a singleton instance
export const coinStateManager = new CoinStateManager();