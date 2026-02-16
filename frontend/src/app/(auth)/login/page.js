//frontend/src/app/(auth)/login/page.js
import { AuthForm } from "@/modules/auth"; // Importing from the MODULE index!

export default function LoginPage() {
  return (
    <div style={{ maxWidth: '400px', margin: '100px auto' }}>
      <AuthForm mode="login" />
    </div>
  );
}