import DialogueBox from './DialogueBox';
import Character from './Character';

export default class DialogueManager {
    scene: Phaser.Scene;
    dialogueBox!: DialogueBox;
    activePhilosopher: Character | null = null;
    isTyping = false;
    isStreaming = false;
    currentMessage = '';
    streamingText = '';
    cursorBlinkEvent: Phaser.Time.TimerEvent | null = null;
    cursorVisible = true;
    hasSetupListeners = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    initialize(dialogueBox: DialogueBox) {
        this.dialogueBox = dialogueBox;

        if (!this.hasSetupListeners) {
            this.setupKeyboardListeners();
            this.hasSetupListeners = true;
        }
    }

    setupKeyboardListeners() {
        this.scene.input.keyboard!.on('keydown', async (event: KeyboardEvent) => {
            // If we aren't typing but we're streaming text, Space skips the animation.
            if (!this.isTyping) {
                if (this.isStreaming && (event.key === 'Space' || event.key === ' ')) {
                    this.skipStreaming();
                }
                return;
            }

            this.handleKeyPress(event);
        });
    }

    async handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            await this.handleEnterKey();
        } else if (event.key === 'Escape') {
            this.closeDialogue();
        } else if (event.key === 'Backspace') {
            this.currentMessage = this.currentMessage.slice(0, -1);
            this.updateDialogueText();
        } else if (event.key.length === 1) {
            if (!this.isTyping) {
                this.currentMessage = '';
                this.isTyping = true;
            }

            this.currentMessage += event.key;
            this.updateDialogueText();
        }
    }

    async handleEnterKey() {
        if (this.currentMessage.trim() !== '') {
            this.dialogueBox.show('...', true);
            this.stopCursorBlink();

            // We removed the Python/Websocket API call here for the rewrite.
            // Every question to the philosopher gets their default response logic for this scaffold setup.
            await this.handleDefaultMessage();

            this.currentMessage = '';
            this.isTyping = false;
        } else if (!this.isTyping) {
            this.restartTypingPrompt();
        }
    }

    async handleDefaultMessage() {
        const apiResponse = this.activePhilosopher?.defaultMessage || "I know that I know nothing.";
        this.dialogueBox.show('', true);
        await this.streamText(apiResponse);
    }

    updateDialogueText() {
        const displayText = this.currentMessage + (this.cursorVisible ? '|' : '');
        this.dialogueBox.show(displayText, true);
    }

    restartTypingPrompt() {
        this.currentMessage = '';
        this.dialogueBox.show('|', true);

        this.stopCursorBlink();
        this.cursorVisible = true;
        this.startCursorBlink();

        this.updateDialogueText();
    }

    startCursorBlink() {
        this.cursorBlinkEvent = this.scene.time.addEvent({
            delay: 300,
            callback: () => {
                if (this.dialogueBox.isVisible() && this.isTyping) {
                    this.cursorVisible = !this.cursorVisible;
                    this.updateDialogueText();
                }
            },
            loop: true
        });
    }

    stopCursorBlink() {
        if (this.cursorBlinkEvent) {
            this.cursorBlinkEvent.remove();
            this.cursorBlinkEvent = null;
        }
    }

    startDialogue(philosopher: Character) {
        this.activePhilosopher = philosopher;
        this.isTyping = true;
        this.currentMessage = '';

        this.dialogueBox.show('|', true);
        this.stopCursorBlink();

        this.cursorVisible = true;
        this.startCursorBlink();
    }

    closeDialogue() {
        this.dialogueBox.hide();
        this.isTyping = false;
        this.currentMessage = '';
        this.isStreaming = false;

        this.stopCursorBlink();
    }

    isInDialogue() {
        return this.dialogueBox && this.dialogueBox.isVisible();
    }

    continueDialogue() {
        if (!this.dialogueBox.isVisible()) return;

        if (this.isStreaming) {
            this.skipStreaming();
        } else if (!this.isTyping) {
            this.isTyping = true;
            this.currentMessage = '';
            this.dialogueBox.show('', false);
            this.restartTypingPrompt();
        }
    }

    async streamText(text: string, speed = 30) {
        this.isStreaming = true;
        let displayedText = '';

        this.stopCursorBlink();

        for (let i = 0; i < text.length; i++) {
            displayedText += text[i];
            this.dialogueBox.show(displayedText, true);

            await new Promise(resolve => setTimeout(resolve, speed));

            if (!this.isStreaming) break;
        }

        if (this.isStreaming) {
            this.dialogueBox.show(text, true);
        }

        this.isStreaming = false;
        return true;
    }

    skipStreaming() {
        this.isStreaming = false;
    }
}
