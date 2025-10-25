import React from 'react';
import PartnerDocumentsTab from '@/components/partner/PartnerDocumentsTab';
import { Helmet } from 'react-helmet';

const PartnerDocumentsPage = () => {
    return (
        <>
            <Helmet>
                <title>Ressources - Portail Partenaire</title>
            </Helmet>
            <PartnerDocumentsTab />
        </>
    );
};

export default PartnerDocumentsPage;