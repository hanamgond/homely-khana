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
                    {/* --- FIX: Removed legacyBehavior --- */}
                    <TabsTrigger value="prep" asChild>
                        <Link href="/kitchen">
                            Prep Sheet
                        </Link>
                    </TabsTrigger>
                     <Link href="/kitchen/dispatch" passHref>
                        <TabsTrigger value="dispatch" asChild>
                           <a>Dispatch Sheet</a>
                        </TabsTrigger>
                    </Link>
                    {/* --- END FIX --- */}
                </TabsList>
            </Tabs>

            {/* Page content */}
            <div>
                {children}
            </div>
        </div>
    );
}