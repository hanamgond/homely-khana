// admin-portal/src/app/(admin)/kitchen/layout.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

export default function KitchenLayout({ children }) {
    const pathname = usePathname();
    const activeTab = pathname === '/kitchen/dispatch' ? 'dispatch' : 'prep';

    return (
        <div className="flex flex-col gap-6">
             {/* Sub Navigation Tabs */}
            <Tabs value={activeTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[300px]">
                    
                    {/* Tab 1: Prep Sheet (This was already mostly correct) */}
                    <TabsTrigger value="prep" asChild>
                        <Link href="/kitchen">
                            Prep Sheet
                        </Link>
                    </TabsTrigger>

                    {/* Tab 2: Dispatch Sheet (FIXED) */}
                    {/* We put Link INSIDE the Trigger, just like the first one */}
                    <TabsTrigger value="dispatch" asChild>
                        <Link href="/kitchen/dispatch">
                           Dispatch Sheet
                        </Link>
                    </TabsTrigger>

                </TabsList>
            </Tabs>

            {/* Page content */}
            <div>
                {children}
            </div>
        </div>
    );
}