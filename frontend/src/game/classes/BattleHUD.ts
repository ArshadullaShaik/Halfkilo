import Phaser from 'phaser';
import Fighter from './Fighter';

/**
 * Full fighting-game HUD drawn entirely with Phaser primitives.
 * Fixed to camera (scrollFactor 0), sits on top of everything.
 */
export default class BattleHUD {
    private scene: Phaser.Scene;
    private W: number;
    private H: number;

    // Graphics layers
    private topBarGfx: Phaser.GameObjects.Graphics;
    private bottomBarGfx: Phaser.GameObjects.Graphics;
    private healthBarGfx: Phaser.GameObjects.Graphics;

    // Text objects
    private titleText: Phaser.GameObjects.Text;
    private p1NameText: Phaser.GameObjects.Text;
    private p2NameText: Phaser.GameObjects.Text;
    private comboTextP1: Phaser.GameObjects.Text;
    private comboTextP2: Phaser.GameObjects.Text;
    private timerText: Phaser.GameObjects.Text;
    private statusText: Phaser.GameObjects.Text;
    private statsText: Phaser.GameObjects.Text;

    // Control labels
    private p1CtrlText: Phaser.GameObjects.Text;
    private p2CtrlText: Phaser.GameObjects.Text;

    // Portrait frames
    private p1Portrait: Phaser.GameObjects.Graphics;
    private p2Portrait: Phaser.GameObjects.Graphics;
    private p1PortraitSprite: Phaser.GameObjects.Sprite | null = null;
    private p2PortraitSprite: Phaser.GameObjects.Sprite | null = null;

    // State
    private remainingTime = 105; // 1:45 in seconds
    private timerEvent: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.W = scene.game.config.width as number;
        this.H = scene.game.config.height as number;

        this.topBarGfx = scene.add.graphics().setScrollFactor(0).setDepth(50);
        this.bottomBarGfx = scene.add.graphics().setScrollFactor(0).setDepth(50);
        this.healthBarGfx = scene.add.graphics().setScrollFactor(0).setDepth(51);

        // — Title —
        this.titleText = this.makeText(this.W / 2, 8, 'AGENT ARENA', 22, '#FFD700')
            .setOrigin(0.5, 0)
            .setStroke('#000000', 4);

        // — Player names & portraits —
        this.p1Portrait = scene.add.graphics().setScrollFactor(0).setDepth(52);
        this.p2Portrait = scene.add.graphics().setScrollFactor(0).setDepth(52);

        this.p1NameText = this.makeText(72, 36, 'PLAYER 1', 13, '#88CCFF')
            .setOrigin(0, 0.5);
        this.p2NameText = this.makeText(this.W - 72, 36, 'PLAYER 2', 13, '#FF8888')
            .setOrigin(1, 0.5);

        // — Combo text —
        this.comboTextP1 = this.makeText(this.W * 0.30, 120, '', 20, '#88DDFF')
            .setOrigin(0.5, 0.5)
            .setStroke('#003366', 4)
            .setVisible(false);

        this.comboTextP2 = this.makeText(this.W * 0.70, 120, '', 20, '#FF8866')
            .setOrigin(0.5, 0.5)
            .setStroke('#660000', 4)
            .setVisible(false);

        // — Bottom bar text —
        this.p1CtrlText = this.makeText(16, this.H - 42, 'P1 (Blue) | F: ⚔ ATK | G: 🛡 BLK | H: 💨 DGE', 11, '#88CCFF')
            .setOrigin(0, 0.5);

        this.p2CtrlText = this.makeText(this.W - 16, this.H - 42, 'P2 (Red) | I: ⚔ ATK | O: 🛡 BLK | P: 💨 DGE', 11, '#FF8888')
            .setOrigin(1, 0.5);

        this.timerText = this.makeText(this.W / 2, this.H - 28, 'REMAINING TIME: 1:45', 12, '#FFFFFF')
            .setOrigin(0.5, 0.5);

        this.statusText = this.makeText(this.W / 2, this.H - 48, 'BATTLE IN PROGRESS', 14, '#FFD700')
            .setOrigin(0.5, 0.5)
            .setStroke('#000000', 3);

        this.statsText = this.makeText(this.W - 16, this.H - 14, 'P1: 0  |  P2: 0', 10, '#AAAAAA')
            .setOrigin(1, 0.5);

        // Draw static panels
        this.drawTopBar();
        this.drawBottomBar();

        // Start countdown
        this.startTimer();
    }

    /* ——— Static panel drawing ——— */

    private drawTopBar() {
        const g = this.topBarGfx;
        g.clear();

        // Semi-transparent dark strip
        g.fillStyle(0x0a0a14, 0.85);
        g.fillRect(0, 0, this.W, 80);

        // Gold accent lines
        g.lineStyle(2, 0xffd700, 0.7);
        g.lineBetween(0, 80, this.W, 80);
        g.lineBetween(0, 0, this.W, 0);

        // Portrait boxes
        this.drawPortraitBox(this.p1Portrait, 10, 32, 0x2244aa);
        this.drawPortraitBox(this.p2Portrait, this.W - 58, 32, 0xaa2222);
    }

    private drawPortraitBox(gfx: Phaser.GameObjects.Graphics, x: number, y: number, borderColor: number) {
        gfx.clear();
        gfx.fillStyle(0x111122, 0.9);
        gfx.fillRect(x, y - 20, 48, 48);
        gfx.lineStyle(2, borderColor, 1);
        gfx.strokeRect(x, y - 20, 48, 48);
    }

    private drawBottomBar() {
        const g = this.bottomBarGfx;
        g.clear();

        // Semi-transparent dark strip
        g.fillStyle(0x0a0a14, 0.85);
        g.fillRect(0, this.H - 64, this.W, 64);

        // Gold accent line at top
        g.lineStyle(2, 0xffd700, 0.7);
        g.lineBetween(0, this.H - 64, this.W, this.H - 64);

        // Divider lines
        g.lineStyle(1, 0x333333, 0.5);
        g.lineBetween(this.W * 0.35, this.H - 60, this.W * 0.35, this.H - 4);
        g.lineBetween(this.W * 0.65, this.H - 60, this.W * 0.65, this.H - 4);
    }

    /* ——— Health / Mana bars ——— */

    drawHealthBars(p1: Fighter, p2: Fighter) {
        const g = this.healthBarGfx;
        g.clear();

        const barW = 320;
        const barH = 16;
        const manaH = 8;

        // — Player 1 (left, blue/gold) —
        const p1x = 68;
        const p1y = 44;
        this.drawBar(g, p1x, p1y, barW, barH, p1.health / p1.maxHealth, 0x2266cc, 0x44aaff, 0xffd700);
        this.drawBar(g, p1x, p1y + barH + 4, barW * 0.8, manaH, p1.mana / p1.maxMana, 0x226622, 0x44dd88, 0x338833);

        // — Player 2 (right, red/gold — draw right-to-left) —
        const p2x = this.W - 68 - barW;
        const p2y = 44;
        this.drawBar(g, p2x, p2y, barW, barH, p2.health / p2.maxHealth, 0xcc2222, 0xff4444, 0xffd700);
        this.drawBar(g, p2x + barW * 0.2, p2y + barH + 4, barW * 0.8, manaH, p2.mana / p2.maxMana, 0x226622, 0x44dd88, 0x338833);
    }

    private drawBar(
        g: Phaser.GameObjects.Graphics,
        x: number, y: number,
        w: number, h: number,
        pct: number,
        bgColor: number, fgColor: number, borderColor: number
    ) {
        // Background
        g.fillStyle(0x111111, 0.8);
        g.fillRect(x, y, w, h);

        // Filled portion
        const fillW = Math.max(0, w * Phaser.Math.Clamp(pct, 0, 1));
        g.fillStyle(bgColor, 1);
        g.fillRect(x, y, fillW, h);

        // Bright top highlight
        g.fillStyle(fgColor, 0.5);
        g.fillRect(x, y, fillW, h / 3);

        // Border
        g.lineStyle(2, borderColor, 0.9);
        g.strokeRect(x, y, w, h);
    }

    /* ——— Portraits ——— */

    setPortraits(p1Atlas: string, p2Atlas: string) {
        // Add small character sprites inside portrait boxes
        if (this.p1PortraitSprite) this.p1PortraitSprite.destroy();
        if (this.p2PortraitSprite) this.p2PortraitSprite.destroy();

        this.p1PortraitSprite = this.scene.add.sprite(34, 32, p1Atlas, `${p1Atlas}-front`)
            .setScrollFactor(0).setDepth(53).setScale(1.3);

        this.p2PortraitSprite = this.scene.add.sprite(this.W - 34, 32, p2Atlas, `${p2Atlas}-front`)
            .setScrollFactor(0).setDepth(53).setScale(1.3);
    }

    /* ——— Combo text ——— */

    showCombo(side: 'left' | 'right', hits: number) {
        const txt = side === 'left' ? this.comboTextP1 : this.comboTextP2;
        const label = side === 'left' ? 'PLAYER 1' : 'PLAYER 2';
        txt.setText(`${label} - ${hits}HIT COMBO!`);
        txt.setVisible(true).setScale(0.5).setAlpha(0);

        this.scene.tweens.add({
            targets: txt,
            scaleX: 1, scaleY: 1,
            alpha: 1,
            duration: 250,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Glitch flicker
                this.scene.tweens.add({
                    targets: txt,
                    alpha: { from: 1, to: 0.6 },
                    duration: 80,
                    yoyo: true,
                    repeat: 2
                });
            }
        });

        // Auto-hide after a while
        this.scene.time.delayedCall(2000, () => {
            this.scene.tweens.add({
                targets: txt,
                alpha: 0,
                duration: 300,
                onComplete: () => txt.setVisible(false)
            });
        });
    }

    /* ——— Timer ——— */

    private startTimer() {
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                    const m = Math.floor(this.remainingTime / 60);
                    const s = this.remainingTime % 60;
                    this.timerText.setText(`REMAINING TIME: ${m}:${s.toString().padStart(2, '0')}`);
                }
            },
            loop: true
        });
    }

    /* ——— Score ——— */

    updateScores(p1Score: number, p2Score: number) {
        this.statsText.setText(`P1: ${p1Score}  |  P2: ${p2Score}`);
    }

    updateStatus(text: string) {
        this.statusText.setText(text);
    }

    /* ——— Utility ——— */

    private makeText(x: number, y: number, text: string, size: number, color: string): Phaser.GameObjects.Text {
        return this.scene.add.text(x, y, text, {
            fontFamily: '"Press Start 2P", Courier, monospace',
            fontSize: `${size}px`,
            color,
            resolution: 2,
        }).setScrollFactor(0).setDepth(52);
    }

    update(p1: Fighter, p2: Fighter) {
        this.drawHealthBars(p1, p2);
        this.updateScores(p1.score, p2.score);
    }

    destroy() {
        if (this.timerEvent) this.timerEvent.destroy();
        this.topBarGfx.destroy();
        this.bottomBarGfx.destroy();
        this.healthBarGfx.destroy();
        this.titleText.destroy();
        this.p1NameText.destroy();
        this.p2NameText.destroy();
        this.comboTextP1.destroy();
        this.comboTextP2.destroy();
        this.timerText.destroy();
        this.statusText.destroy();
        this.statsText.destroy();
        this.p1CtrlText.destroy();
        this.p2CtrlText.destroy();
        this.p1Portrait.destroy();
        this.p2Portrait.destroy();
        if (this.p1PortraitSprite) this.p1PortraitSprite.destroy();
        if (this.p2PortraitSprite) this.p2PortraitSprite.destroy();
    }
}
