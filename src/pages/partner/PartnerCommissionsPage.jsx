import React from 'react';
import PartnerCommissionsTab from '@/components/partner/PartnerCommissionsTab';
import { Helmet } from 'react-helmet';

const PartnerCommissionsPage = () => {
    return (
        <>
            <Helmet>
                <title>Mes Commissions - Portail Partenaire</title>
            </Helmet>
            <PartnerCommissionsTab />
        </>
    );
};

export default PartnerCommissionsPage;