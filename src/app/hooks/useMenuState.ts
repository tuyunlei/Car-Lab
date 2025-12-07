
import { useState, useCallback } from 'react';

export interface MenuState {
    isMenuOpen: boolean;
    showTests: boolean;
    showControls: boolean;
}

export interface MenuActions {
    openMenu: () => void;
    closeMenu: () => void;
    openTests: () => void;
    closeTests: () => void;
    openControls: () => void;
    closeControls: () => void;
}

export function useMenuState(initialMenuOpen = true): [MenuState, MenuActions] {
    const [isMenuOpen, setIsMenuOpen] = useState(initialMenuOpen);
    const [showTests, setShowTests] = useState(false);
    const [showControls, setShowControls] = useState(false);

    const openMenu = useCallback(() => setIsMenuOpen(true), []);
    const closeMenu = useCallback(() => setIsMenuOpen(false), []);

    const openTests = useCallback(() => {
        setShowTests(true);
        setIsMenuOpen(false);
    }, []);
    const closeTests = useCallback(() => setShowTests(false), []);

    const openControls = useCallback(() => {
        setShowControls(true);
        setIsMenuOpen(false);
    }, []);
    const closeControls = useCallback(() => setShowControls(false), []);

    return [
        { isMenuOpen, showTests, showControls },
        { openMenu, closeMenu, openTests, closeTests, openControls, closeControls }
    ];
}
