import React from 'react';
import PartnerServiceTrackingTab from '@/components/partner/PartnerServiceTrackingTab';
import { Helmet } from 'react-helmet';

const PartnerTrackingPage = () => {
    return (
        <>
            <Helmet>
                <title>Suivi des Services - Portail Partenaire</title>
            </Helmet>
            <PartnerServiceTrackingTab />
        </>
    );
};

export default PartnerTrackingPage;