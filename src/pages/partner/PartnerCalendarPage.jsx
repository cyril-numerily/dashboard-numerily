import React from 'react';
import PartnerCalendarTab from '@/components/partner/PartnerCalendarTab';
import { Helmet } from 'react-helmet';

const PartnerCalendarPage = () => {
    return (
        <>
            <Helmet>
                <title>Calendrier - Portail Partenaire</title>
            </Helmet>
            <PartnerCalendarTab />
        </>
    );
};

export default PartnerCalendarPage;