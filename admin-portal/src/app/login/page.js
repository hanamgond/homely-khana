//admin-portal/src/app/login/page.js
// admin-portal/src/app/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function LoginPage() {

  const [phone, setPhone] = useState('1234567890');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phone || !password) {
      toast.error('Please enter phone and password');
      return;
    }

    setIsLoading(true);

    try {

      // send phone as identifier
      await login(phone, password);

      toast.success('Login Successful!');

      // redirect to dashboard
      router.push('/');

    } catch (error) {

      console.error(error);

      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        'Login failed'
      );

      setIsLoading(false);

    }

  };

  return (

    <div className="flex min-h-screen items-center justify-center bg-muted/40">

      <Card className="w-full max-w-sm">

        <CardHeader>
          <CardTitle className="text-2xl">
            HomelyKhana Admin
          </CardTitle>

          <CardDescription>
            Enter your admin credentials to access the portal.
          </CardDescription>
        </CardHeader>

        <CardContent>

          <form onSubmit={handleSubmit} className="grid gap-4">

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>

              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

            </div>

            <div className="grid gap-2">

              <Label htmlFor="password">Password</Label>

              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

          </form>

        </CardContent>

      </Card>

    </div>

  );

}