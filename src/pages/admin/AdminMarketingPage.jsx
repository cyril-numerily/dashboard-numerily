import React from 'react';
import { Helmet } from 'react-helmet';
import AdminMarketingTab from '@/components/admin/AdminMarketingTab';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

const AdminMarketingPage = () => {
    return (
        <>
            <Helmet>
                <title>Marketing - Admin</title>
            </Helmet>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <Megaphone className="w-6 h-6" />
                        Outils Marketing
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminMarketingTab />
                </CardContent>
            </Card>
        </>
    );
};

export default AdminMarketingPage;