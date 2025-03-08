import React from 'react';
import { ProfileDialog } from "../components/ProfileDialog";
import { useMyNavigate } from '../utils';

interface CreateProfileProps {
    noMargin?: boolean;
    finishAdd?: () => void;
}

export function CreateProfile(props: CreateProfileProps) {
    const navigate = useMyNavigate();
    return (
      <ProfileDialog
        mode='create'
        open={true}
        finishAdd={() => navigate('/team')}
        onCancel={() => navigate('/logout')}
        onSaveCompleted={() => navigate('/team')}
      />
    );
}
export default CreateProfile;