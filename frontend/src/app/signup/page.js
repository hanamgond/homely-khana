//frontend/src/app/signup/page.js
import AuthForm from '@/components/auth/AuthForm';

// This is the Server Component for the /signup route
export const metadata = {
  title: 'Sign Up - HomelyKhana',
};

export default function SignupPage() {
    // We render the unified form, telling it to default to the 'signup' tab
    return <AuthForm defaultTab="signup" />;
}