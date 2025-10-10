import { Injectable } from '@angular/core';
import { PlantingAreaSelection } from '@fiap-hackaton/map-ui';

export interface MobileBridgeMessage {
  action: string;
  data?: unknown;
}

@Injectable({ providedIn: 'root' })
export class MobileBridgeService {
  private isMobileApp(): boolean {
    return !!(window as Window & { ReactNativeWebView?: unknown }).ReactNativeWebView;
  }

  sendToNative(message: MobileBridgeMessage): void {
    if (this.isMobileApp()) {
      (window as unknown as Window & { ReactNativeWebView: { postMessage: (msg: string) => void } }).ReactNativeWebView.postMessage(
				JSON.stringify(message)
			);
    }
  }

  onMessageFromNative(callback: (message: MobileBridgeMessage) => void): void {
    if (this.isMobileApp()) {
      window.addEventListener('message', (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          callback(message);
        } catch {
          // Silently ignore parse errors
        }
      });
    }
  }

  sendAreaSelection(selection: PlantingAreaSelection): void {
    this.sendToNative({
      action: 'areaSelected',
      data: selection
    });
  }

  notifyMapReady(): void {
    this.sendToNative({
      action: 'mapReady'
    });
  }
}
