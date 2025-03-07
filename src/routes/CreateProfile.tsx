import React from 'react';
import { ProfileDialog } from "../components/ProfileDialog";
import { useNavigate } from 'react-router-dom';

interface CreateProfileProps {
    noMargin?: boolean;
    finishAdd?: () => void;
}

export function CreateProfile(props: CreateProfileProps) {
    const navigate = useNavigate();
    return (
      <ProfileDialog
        mode='create'
        open={true}
        finishAdd={() => navigate('/team')}
        onCancel={() => navigate('/logout')}
        onSave={() => navigate('/team')}
      />
    );
}
export default CreateProfile;