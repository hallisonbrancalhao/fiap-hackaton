import { initializeApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyDBKd7Ffg82OAYTG3nPRK-DHcbYrT9Ccg0',
  authDomain: 'fiap-farms-3e501.firebaseapp.com',
  projectId: 'fiap-farms-3e501',
  storageBucket: 'fiap-farms-3e501.firebasestorage.app',
  messagingSenderId: '916780746601',
  appId: '1:916780746601:web:420e47629af9ff72c19ff8'
}

const app = initializeApp(firebaseConfig)

export const auth: Auth = getAuth(app)

export { app }
