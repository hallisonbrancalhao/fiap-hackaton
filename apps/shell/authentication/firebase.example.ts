/**
 * EXEMPLO DE CONFIGURAÇÃO DO FIREBASE
 * 
 * Este arquivo mostra como configurar o Firebase para o projeto.
 * Copie este arquivo para src/data/services/firebaseConfig.ts e
 * substitua os valores pelos do seu projeto Firebase.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Configuração do Firebase
 * 
 * Para obter essas configurações:
 * 1. Acesse https://console.firebase.google.com/
 * 2. Crie um novo projeto ou selecione um existente
 * 3. Vá em "Configurações do projeto" (ícone de engrenagem)
 * 4. Role para baixo até "Seus aplicativos"
 * 5. Clique em "Adicionar aplicativo" e escolha "Web"
 * 6. Copie as configurações que aparecem
 */
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "fiap-farms-auth.firebaseapp.com",
  projectId: "fiap-farms-auth",
  storageBucket: "fiap-farms-auth.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

/**
 * Inicializa o Firebase
 */
const app = initializeApp(firebaseConfig);

/**
 * Inicializa o Auth do Firebase
 */
export const auth: Auth = getAuth(app);

/**
 * Exporta a instância do app para uso em outros serviços
 */
export { app };

/**
 * INSTRUÇÕES PARA CONFIGURAR O FIREBASE:
 * 
 * 1. Habilite a autenticação por email/senha:
 *    - No console do Firebase, vá em "Authentication"
 *    - Clique em "Get started"
 *    - Vá na aba "Sign-in method"
 *    - Habilite "Email/Password"
 * 
 * 2. Configure as regras de segurança (opcional):
 *    - No console, vá em "Firestore Database"
 *    - Clique em "Create database"
 *    - Escolha "Start in test mode" (para desenvolvimento)
 * 
 * 3. Configure o domínio autorizado:
 *    - Em Authentication > Settings > Authorized domains
 *    - Adicione localhost para desenvolvimento
 *    - Adicione seu domínio de produção
 */
