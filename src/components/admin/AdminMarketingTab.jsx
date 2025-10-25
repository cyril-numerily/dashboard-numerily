import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PromoCodesManagementTab from '@/components/admin/PromoCodesManagementTab';
import NumerilyDocumentsTab from '@/components/admin/NumerilyDocumentsTab';
import { Ticket, FileArchive } from 'lucide-react';

const AdminMarketingTab = () => {
    return (
        <Tabs defaultValue="promocodes" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50 rounded-lg">
                <TabsTrigger value="promocodes" className="gap-2 text-base py-3">
                    <Ticket className="w-5 h-5" /> Codes Promo
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2 text-base py-3">
                    <FileArchive className="w-5 h-5" /> Documents
                </TabsTrigger>
            </TabsList>
            <TabsContent value="promocodes">
                <PromoCodesManagementTab />
            </TabsContent>
            <TabsContent value="documents">
                <NumerilyDocumentsTab />
            </TabsContent>
        </Tabs>
    );
};

export default AdminMarketingTab;