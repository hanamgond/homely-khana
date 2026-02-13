//frontend/src/modules/auth/index.js
// This file controls what the rest of the app can see
export { default as AuthForm } from './components/AuthForm';
export { default as SignupClient } from './components/SignupClient';
export { default as ForgotPasswordClient } from './components/ForgotPasswordClient'; // <-- Add this

// Later we will export services like:
// export * from './services/authService';