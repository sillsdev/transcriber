import React, { useState } from 'react';
import { ProfileDialog } from "../components/ProfileDialog";
import { restoreScroll } from '../utils';

interface CreateProfileProps {
    noMargin?: boolean;
    finishAdd?: () => void;
}

export function CreateProfile(props: CreateProfileProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [profileOpen, setProfileOpen] = React.useState(false);
    const handleProfile = (visible: boolean) => () => {
        if (visible !== profileOpen) setProfileOpen(visible);
        restoreScroll();
        setAnchorEl(null);
    };
    return (
        <ProfileDialog open={true} readOnlyMode={false} onClose={handleProfile(false)} />
    )
}
export default CreateProfile;