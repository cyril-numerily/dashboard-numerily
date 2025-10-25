import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import AdminServicesTab from '@/components/admin/AdminServicesTab';
import { Star } from 'lucide-react';

const AdminServicesPage = () => {
    return (
        <>
            <Helmet>
                <title>Gestion des Services - Admin</title>
            </Helmet>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <Star className="w-6 h-6" />
                        Catalogue des Services
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminServicesTab />
                </CardContent>
            </Card>
        </>
    );
};

export default AdminServicesPage;