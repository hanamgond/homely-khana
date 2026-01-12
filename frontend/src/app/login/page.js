// frontend/src/app/login/page.js
import AuthForm from '@/components/auth/AuthForm';

// This is the Server Component for the /login route
export const metadata = {
  title: 'Login - HomelyKhana',
};

export default function LoginPage() {
    // We render the unified form, telling it to default to the 'login' tab
    return <AuthForm defaultTab="login" />;
}