import { Scene } from 'phaser';

export default class DialogueBox {
    scene: Scene;
    awaitingInput: boolean;
    text: Phaser.GameObjects.Text;
    container: Phaser.GameObjects.Container;

    constructor(scene: Scene, config: any = {}) {
        this.scene = scene;
        this.awaitingInput = false;

        // Set default configuration values
        const {
            x = 100,
            y = 500,
            width = 824,
            height = 200,
            backgroundColor = 0x000000,
            backgroundAlpha = 0.7,
            borderColor = 0xffffff,
            borderWidth = 2,
            textConfig = {
                font: '24px Arial',
                fill: '#ffffff',
                wordWrap: { width: 784 }
            },
            depth = 30
        } = config;

        // Create text with padding
        this.text = scene.add.text(x + 20, y + 20, '', textConfig);

        // Group elements
        this.container = scene.add.container(0, 0, [this.text]);
        this.container.setDepth(depth);
        this.container.setScrollFactor(0);
        this.hide();
    }

    show(message: string, awaitInput = false) {
        this.text.setText(message);
        this.container.setVisible(true);
        this.awaitingInput = awaitInput;
    }

    hide() {
        this.container.setVisible(false);
        this.awaitingInput = false;
    }

    isVisible() {
        return this.container.visible;
    }

    isAwaitingInput() {
        return this.awaitingInput;
    }
}
