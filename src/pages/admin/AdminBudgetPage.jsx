import React from 'react';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminCommissionsTab from '@/components/admin/AdminCommissionsTab';
import AdminBudgetTab from '@/components/admin/AdminBudgetTab';
import { Wallet, DollarSign } from 'lucide-react';

const AdminBudgetPage = () => {
    return (
        <>
            <Helmet>
                <title>Budget - Admin</title>
            </Helmet>
            <div className="space-y-6">
                <div>
                    <h1 className="text-4xl font-bold text-foreground">Budget & Finances</h1>
                    <p className="text-lg text-muted-foreground">Gérez le budget de Numerily et les commissions des partenaires.</p>
                </div>
                <Tabs defaultValue="budget" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="budget">
                            <Wallet className="mr-2 h-4 w-4" />
                            Gestion du Budget
                        </TabsTrigger>
                        <TabsTrigger value="commissions">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Commissions Partenaires
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="budget" className="mt-6">
                        <AdminBudgetTab />
                    </TabsContent>
                    <TabsContent value="commissions" className="mt-6">
                        <AdminCommissionsTab />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
};

export default AdminBudgetPage;