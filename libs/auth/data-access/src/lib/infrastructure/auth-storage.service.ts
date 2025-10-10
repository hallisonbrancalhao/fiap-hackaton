import { Injectable } from '@angular/core';
import { FarmUser } from '@fiap-hackaton/auth-domain';

const STORAGE_KEY = 'fiap_farm_user';

@Injectable({
  providedIn: 'root',
})
export class AuthStorageService {
  /**
   * Salva o usuário no localStorage
   */
  saveUser(user: FarmUser): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (_) {
			return;
		}
  }

  /**
   * Recupera o usuário do localStorage
   */
  getUser(): FarmUser | null {
    try {
      const userData = localStorage.getItem(STORAGE_KEY);
      if (!userData) {
        return null;
      }
      return JSON.parse(userData) as FarmUser;
    } catch (_) {
			return null;
		}
  }

  /**
   * Remove o usuário do localStorage
   */
  clearUser(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      return;
    }
  }

  /**
   * Verifica se existe usuário salvo
   */
  hasUser(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }
}
