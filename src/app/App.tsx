
import React from 'react';
import { GameCanvas } from './components/GameCanvas';
import { SandboxControls } from './components/SandboxControls';
import { UnitTests } from './components/UnitTests';
import { ControlsSettings } from './components/ControlsSettings';
import { MainMenu } from './components/MainMenu';
import { TopNavBar } from './components/TopNavBar';
import { useGameState } from './hooks/useGameState';
import { useMenuState } from './hooks/useMenuState';
import { ControlsProvider } from './contexts/ControlsContext';
import { GameMode } from '../game/types';
import { LessonDefinition } from '../game/lessonTypes';

const AppContent: React.FC = () => {
    const [gameState, gameActions] = useGameState();
    const [menuState, menuActions] = useMenuState(true);

    const handleStartLesson = (lesson: LessonDefinition) => {
        gameActions.startLesson(lesson);
        menuActions.closeMenu();
    };

    const handleEnterSandbox = () => {
        gameActions.enterSandbox();
        menuActions.closeMenu();
    };

    const handleExitLesson = () => {
        gameActions.exitLesson();
        menuActions.openMenu();
    };

    return (
        <div className="w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 relative transition-colors duration-300">
            <TopNavBar
                gameMode={gameState.gameMode}
                activeLesson={gameState.activeLesson}
                currentLevel={gameState.currentLevel}
                onMenuOpen={menuActions.openMenu}
            />

            {menuState.isMenuOpen && (
                <MainMenu
                    gameMode={gameState.gameMode}
                    activeLesson={gameState.activeLesson}
                    progress={gameState.progress}
                    onClose={menuActions.closeMenu}
                    onEnterSandbox={handleEnterSandbox}
                    onStartLesson={handleStartLesson}
                    onOpenControls={menuActions.openControls}
                    onOpenTests={menuActions.openTests}
                />
            )}

            {menuState.showTests && <UnitTests onClose={menuActions.closeTests} />}
            {menuState.showControls && <ControlsSettings onClose={menuActions.closeControls} />}

            <div className="w-full h-full pt-16 relative">
                <GameCanvas
                    key={`${gameState.currentLevel.id}-${gameState.gameMode}`}
                    level={gameState.currentLevel}
                    mode={gameState.gameMode}
                    carConfig={gameState.carConfig}
                    activeLesson={gameState.activeLesson}
                    onExit={handleExitLesson}
                    onLessonFinish={gameActions.handleLessonFinish}
                />

                {gameState.gameMode === GameMode.SANDBOX && (
                    <SandboxControls
                        config={gameState.carConfig}
                        onUpdate={gameActions.setCarConfig}
                    />
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => (
    <ControlsProvider>
        <AppContent />
    </ControlsProvider>
);

export default App;
