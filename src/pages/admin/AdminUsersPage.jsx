import React from 'react';
import UserManagementTab from '@/components/admin/UserManagementTab';
import { Helmet } from 'react-helmet';

const AdminUsersPage = () => {
    return (
        <>
            <Helmet>
                <title>Gestion des Utilisateurs - Admin</title>
            </Helmet>
            <UserManagementTab />
        </>
    );
};

export default AdminUsersPage;