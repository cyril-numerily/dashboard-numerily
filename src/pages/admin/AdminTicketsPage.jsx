import React from 'react';
import AdminRequestsTab from '@/components/admin/AdminRequestsTab';
import { Helmet } from 'react-helmet';

const AdminTicketsPage = () => {
    return (
        <>
            <Helmet>
                <title>Gestion des Tickets et Demandes - Admin</title>
            </Helmet>
            <AdminRequestsTab />
        </>
    );
};

export default AdminTicketsPage;