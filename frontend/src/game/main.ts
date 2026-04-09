import Phaser from 'phaser';

// We will export a function that instantiates the game, rather than exporting 
// a singleton game instance globally to be SSR safe and support Next.js Navigation
const StartGame = async (parent: string): Promise<Phaser.Game> => {

    // Dynamic imports for scenes to prevent SSR breaks when fetching Phaser code
    const { Preloader } = await import('./scenes/Preloader');
    const { MainMenu } = await import('./scenes/MainMenu');
    const { Game } = await import('./scenes/Game');
    const { PauseMenu } = await import('./scenes/PauseMenu');
    const { BattleScene } = await import('./scenes/BattleScene');

    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 1024,
        height: 768,
        parent: parent,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [
            Preloader,
            MainMenu,
            Game,
            PauseMenu,
            BattleScene
        ],
        physics: {
            default: "arcade",
            arcade: {
                gravity: { y: 0, x: 0 },
            },
        },
    };

    return new Phaser.Game(config);
};

export default StartGame;
