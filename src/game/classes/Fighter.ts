import Phaser from 'phaser';

export type FighterState = 'idle' | 'attack' | 'block' | 'dodge' | 'hit' | 'defeated';
export type FighterSide = 'left' | 'right';

export interface FighterConfig {
    id: string;
    name: string;
    atlas: string;
    side: FighterSide;
    tintColor: number;    // e.g. 0x4488ff (blue) or 0xff4444 (red)
    glowColor: number;    // aura glow color
}

export default class Fighter {
    scene: Phaser.Scene;
    id: string;
    name: string;
    atlas: string;
    side: FighterSide;
    tintColor: number;
    glowColor: number;

    sprite: Phaser.Physics.Arcade.Sprite;
    aura: Phaser.GameObjects.Graphics;
    shadow: Phaser.GameObjects.Ellipse;

    state: FighterState = 'idle';
    health = 100;
    maxHealth = 100;
    mana = 100;
    maxMana = 100;
    comboCount = 0;
    score = 0;

    baseX: number;
    baseY: number;
    currentFacing: 'left' | 'right';
    private auraPulse = 0;
    private isJumping = false;

    constructor(scene: Phaser.Scene, config: FighterConfig) {
        this.scene = scene;
        this.id = config.id;
        this.name = config.name;
        this.atlas = config.atlas;
        this.side = config.side;
        this.tintColor = config.tintColor;
        this.glowColor = config.glowColor;

        // Position fighters on left or right of the arena
        const centerX = (scene.game.config.width as number) / 2;
        const groundY = (scene.game.config.height as number) * 0.6;
        this.baseX = this.side === 'left' ? centerX - 180 : centerX + 180;
        this.baseY = groundY;
        this.currentFacing = this.side === 'left' ? 'right' : 'left';

        // Shadow on the ground
        this.shadow = scene.add.ellipse(this.baseX, this.baseY + 40, 60, 16, 0x000000, 0.35)
            .setDepth(4);

        // Aura glow behind character
        this.aura = scene.add.graphics().setDepth(5);

        // Character sprite
        this.sprite = scene.physics.add.sprite(this.baseX, this.baseY, this.atlas, `${this.atlas}-${this.currentFacing}`)
            .setDepth(6)
            .setScale(2.2)
            .setImmovable(true);
        (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

        // Create walk animations if they don't exist
        this.ensureAnimations();

        // Start idle breathing animation
        this.playIdle();
    }

    private ensureAnimations() {
        const anims = this.scene.anims;
        const dirs = ['left', 'right', 'front', 'back'];
        dirs.forEach(dir => {
            const key = `${this.atlas}-${dir}-walk`;
            if (!anims.exists(key)) {
                const frames = anims.generateFrameNames(this.atlas, {
                    prefix: `${this.atlas}-${dir}-walk-`,
                    end: 8,
                    zeroPad: 4,
                });
                if (frames.length > 0) {
                    anims.create({ key, frames, frameRate: 10, repeat: -1 });
                }
            }
        });
    }

    playIdle() {
        this.state = 'idle';
        this.sprite.setTexture(this.atlas, `${this.atlas}-${this.currentFacing}`);

        // Subtle breathing tween
        this.scene.tweens.add({
            targets: this.sprite,
            scaleY: { from: 2.2, to: 2.28 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    move(dx: number, dy: number) {
        if (this.state !== 'idle' || this.isJumping) return;

        this.baseX += dx;
        this.baseY += dy;

        // Keep within bounds
        const W = this.scene.game.config.width as number;
        const H = this.scene.game.config.height as number;
        this.baseX = Phaser.Math.Clamp(this.baseX, 40, W - 40);
        this.baseY = Phaser.Math.Clamp(this.baseY, H * 0.4, H * 0.9);

        this.sprite.x = this.baseX;
        this.sprite.y = this.baseY;

        // Play walking animation
        const walkKey = `${this.atlas}-${this.currentFacing}-walk`;
        if (this.scene.anims.exists(walkKey)) {
            this.sprite.anims.play(walkKey, true);
        }
    }

    stopMoving() {
        if (this.state === 'idle' && !this.isJumping) {
            this.sprite.anims.stop();
            this.sprite.setTexture(this.atlas, `${this.atlas}-${this.currentFacing}`);
        }
    }

    faceTarget(targetX: number) {
        if (this.state !== 'idle' || this.isJumping) return;

        const desiredFacing: 'left' | 'right' = targetX >= this.sprite.x ? 'right' : 'left';
        if (desiredFacing !== this.currentFacing) {
            this.currentFacing = desiredFacing;
            this.sprite.setTexture(this.atlas, `${this.atlas}-${this.currentFacing}`);
        }
    }

    jump() {
        if (this.state !== 'idle' || this.isJumping) return;

        this.isJumping = true;
        this.scene.tweens.killTweensOf(this.sprite);
        this.sprite.anims.stop();

        this.sprite.setTexture(this.atlas, `${this.atlas}-${this.currentFacing}`);

        this.scene.tweens.add({
            targets: this.sprite,
            y: this.baseY - 80,
            duration: 220,
            ease: 'Sine.easeOut',
            yoyo: true,
            onStart: () => {
                this.shadow.setScale(0.75, 0.75).setAlpha(0.22);
            },
            onComplete: () => {
                this.sprite.y = this.baseY;
                this.shadow.setScale(1, 1).setAlpha(0.35);
                this.isJumping = false;
                this.playIdle();
            }
        });
    }

    playAttack(onComplete?: () => void) {
        this.state = 'attack';
        const dir = this.currentFacing === 'right' ? 1 : -1;
        const walkKey = `${this.atlas}-${this.currentFacing}-walk`;

        // Stop idle tween
        this.scene.tweens.killTweensOf(this.sprite);
        this.sprite.setScale(2.2);

        // Lunge forward
        if (this.scene.anims.exists(walkKey)) {
            this.sprite.anims.play(walkKey, true);
        }

        this.scene.tweens.add({
            targets: this.sprite,
            x: this.baseX + (80 * dir),
            duration: 200,
            ease: 'Power2',
            yoyo: true,
            onComplete: () => {
                this.sprite.anims.stop();
                this.sprite.setTexture(this.atlas, `${this.atlas}-${this.currentFacing}`);
                this.playIdle();
                if (onComplete) onComplete();
            }
        });
    }

    playBlock() {
        this.state = 'block';
        this.scene.tweens.killTweensOf(this.sprite);
        this.sprite.setTint(0xaaaaff);
        this.sprite.setScale(2.2, 2.0);

        this.scene.time.delayedCall(500, () => {
            this.sprite.clearTint();
            this.sprite.setScale(2.2);
            this.playIdle();
        });
    }

    playDodge() {
        this.state = 'dodge';
        const dir = this.side === 'left' ? -1 : 1;
        this.scene.tweens.killTweensOf(this.sprite);

        this.sprite.setAlpha(0.5);
        this.scene.tweens.add({
            targets: this.sprite,
            x: this.baseX + (50 * dir),
            alpha: 1,
            duration: 300,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.playIdle();
            }
        });
    }

    playHit(damage: number) {
        this.state = 'hit';
        this.health = Math.max(0, this.health - damage);

        this.scene.tweens.killTweensOf(this.sprite);
        this.sprite.setTint(0xff0000);

        // Shake
        const origX = this.sprite.x;
        this.scene.tweens.add({
            targets: this.sprite,
            x: origX + 8,
            duration: 40,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.sprite.clearTint();
                this.sprite.x = origX;
                if (this.health <= 0) {
                    this.playDefeated();
                } else {
                    this.playIdle();
                }
            }
        });
    }

    playDefeated() {
        this.state = 'defeated';
        this.scene.tweens.killTweensOf(this.sprite);
        this.sprite.setTint(0x666666);

        this.scene.tweens.add({
            targets: this.sprite,
            angle: this.side === 'left' ? -90 : 90,
            y: this.baseY + 20,
            alpha: 0.6,
            duration: 600,
            ease: 'Bounce.easeOut'
        });
    }

    updateAura(time: number) {
        this.aura.clear();
        if (this.state === 'defeated') return;

        this.auraPulse = Math.sin(time * 0.003) * 0.3 + 0.5;
        const r = 45 + this.auraPulse * 15;

        // Outer glow
        this.aura.fillStyle(this.glowColor, this.auraPulse * 0.25);
        this.aura.fillCircle(this.sprite.x, this.sprite.y, r + 20);

        // Inner glow
        this.aura.fillStyle(this.glowColor, this.auraPulse * 0.4);
        this.aura.fillCircle(this.sprite.x, this.sprite.y, r);
    }

    update(time: number) {
        this.updateAura(time);

        // Update shadow position
        this.shadow.setPosition(this.sprite.x, this.baseY + 40);
    }

    destroy() {
        this.scene.tweens.killTweensOf(this.sprite);
        this.sprite.destroy();
        this.aura.destroy();
        this.shadow.destroy();
    }
}
