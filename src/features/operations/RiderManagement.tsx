import React from 'react';
import UserManagementPanel from '../admin/users/UserManagementPanel';

interface RiderManagementProps {
    franchiseId: string;
    readOnly?: boolean;
}

const RiderManagement: React.FC<RiderManagementProps> = ({ franchiseId, readOnly = false }) => {
    return (
        <UserManagementPanel
            franchiseId={franchiseId}
            readOnly={readOnly}
        />
    );
};

export default RiderManagement;
