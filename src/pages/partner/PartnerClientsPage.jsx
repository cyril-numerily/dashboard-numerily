import React from 'react';
import PartnerClientsTab from '@/components/partner/PartnerClientsTab';
import { Helmet } from 'react-helmet';

const PartnerClientsPage = () => {
    return (
        <>
            <Helmet>
                <title>Mes Clients - Portail Partenaire</title>
            </Helmet>
            <PartnerClientsTab />
        </>
    );
};

export default PartnerClientsPage;