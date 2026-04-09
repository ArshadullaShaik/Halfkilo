import { Scene } from 'phaser';
import Character from '../classes/Character';
import DialogueBox from '../classes/DialogueBox';
import DialogueManager from '../classes/DialogueManager';

export class Game extends Scene {

    player: Phaser.Physics.Arcade.Sprite | null = null;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
    dialogueBox!: DialogueBox;
    spaceKey!: Phaser.Input.Keyboard.Key;
    wasdKeys!: any;
    dialogueText!: Phaser.GameObjects.Text;
    activePhilosopher: Character | null = null;
    dialogueManager!: DialogueManager;
    philosophers: Character[] = [];
    labelsVisible = true;

    // Auto-battler state
    fighters: Character[] = [];
    isBattling = false;

    constructor() {
        super('Game');
    }

    create() {
        const map = this.createTilemap();
        const tileset = this.addTileset(map);
        const layers = this.createLayers(map, tileset);
        let screenPadding = 20;
        let maxDialogueHeight = 200;

        // this.createPhilosophers(map, layers);

        this.setupPlayer(map, layers.worldLayer!);
        const camera = this.setupCamera(map);

        this.setupControls(camera);

        this.setupDialogueSystem();

        this.dialogueBox = new DialogueBox(this);
        this.dialogueText = this.add
            .text(60, this.game.config.height as number - maxDialogueHeight - screenPadding + screenPadding, '', {
                font: "18px monospace",
                color: "#ffffff",
                padding: { x: 20, y: 10 },
                wordWrap: { width: 680 },
                lineSpacing: 6,
                maxLines: 5
            })
            .setScrollFactor(0)
            .setDepth(30)
            .setVisible(false);

        this.spaceKey = this.input.keyboard!.addKey('SPACE');

        // Initialize the dialogue manager
        this.dialogueManager = new DialogueManager(this);
        this.dialogueManager.initialize(this.dialogueBox);

        // Autobattler Event Bridge Setup — launch dedicated BattleScene
        const handleBattleStart = (e: CustomEvent) => {
            this.scene.start('BattleScene', {
                p1Name: e.detail.agentAName || 'Player 1',
                p2Name: e.detail.agentBName || 'Player 2',
                p1Atlas: 'sophia',
                p2Atlas: 'aristotle',
                ...e.detail
            });
        };
        window.addEventListener('START_BATTLE', handleBattleStart as EventListener);
        this.events.on(Phaser.Scenes.Events.DESTROY, () => {
            window.removeEventListener('START_BATTLE', handleBattleStart as EventListener);
        });
    }

    spawnFighters(data: any) {
        if (this.isBattling) return;
        this.isBattling = true;

        // Cleanup previous fighters
        this.fighters.forEach(f => f.destroy());
        this.fighters = [];

        // Center screen spawn positions
        const centerX = 500;
        const centerY = 350;

        // Team 1 (Left)
        const agentA = new Character(this, {
            id: "agent_a",
            name: data.agentAName || "Your Agent",
            spawnPoint: { x: centerX - 150, y: centerY },
            atlas: "sophia",
            defaultDirection: "right",
            canRoam: false,
            worldLayer: null
        });

        const petA = new Character(this, {
            id: "pet_a",
            name: data.petAName || "Pet",
            spawnPoint: { x: centerX - 210, y: centerY + 20 },
            atlas: "plato", // Placeholder pet sprite
            defaultDirection: "right",
            canRoam: false,
            worldLayer: null
        });

        // Team 2 (Right)
        const agentB = new Character(this, {
            id: "agent_b",
            name: data.agentBName || "Enemy Agent",
            spawnPoint: { x: centerX + 150, y: centerY },
            atlas: "aristotle",
            defaultDirection: "left",
            canRoam: false,
            worldLayer: null
        });

        const petB = new Character(this, {
            id: "pet_b",
            name: data.petBName || "Enemy Pet",
            spawnPoint: { x: centerX + 210, y: centerY + 20 },
            atlas: "socrates", // Placeholder pet sprite
            defaultDirection: "left",
            canRoam: false,
            worldLayer: null
        });

        this.fighters = [agentA, petA, agentB, petB];

        // Face off
        agentA.sprite.setTexture("sophia", "sophia-right");
        petA.sprite.setTexture("plato", "plato-right");
        agentB.sprite.setTexture("aristotle", "aristotle-left");
        petB.sprite.setTexture("socrates", "socrates-left");

        // Execute Clash Animation Sequence
        this.animateClash(agentA, petA, agentB, petB, data.winnerIsA);
    }

    animateClash(agentA: Character, petA: Character, agentB: Character, petB: Character, winnerIsA: boolean) {
        // Move towards the center
        this.tweens.add({
            targets: [agentA.sprite, petA.sprite],
            x: '+=60',
            duration: 1000,
            ease: 'Power2',
            onStart: () => {
                agentA.sprite.anims.play("sophia-right-walk", true);
                petA.sprite.anims.play("plato-right-walk", true);
            },
            onComplete: () => {
                agentA.sprite.anims.stop();
                petA.sprite.anims.stop();
            }
        });

        this.tweens.add({
            targets: [agentB.sprite, petB.sprite],
            x: '-=60',
            duration: 1000,
            ease: 'Power2',
            onStart: () => {
                agentB.sprite.anims.play("aristotle-left-walk", true);
                petB.sprite.anims.play("socrates-left-walk", true);
            },
            onComplete: () => {
                agentB.sprite.anims.stop();
                petB.sprite.anims.stop();

                // Show clash bubble
                this.showHitSparks();

                // Resolve
                this.time.delayedCall(800, () => {
                    this.resolveBattle(agentA, petA, agentB, petB, winnerIsA);
                });
            }
        });
    }

    showHitSparks() {
        const sparks = this.add.text(500, 320, '💥BAM!💥', {
            font: '32px Arial',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(40);

        this.tweens.add({
            targets: sparks,
            scale: 1.5,
            yoyo: true,
            duration: 150,
            onComplete: () => sparks.destroy()
        });
    }

    resolveBattle(agentA: Character, petA: Character, agentB: Character, petB: Character, winnerIsA: boolean) {
        if (winnerIsA) {
            agentB.sprite.setTint(0xff0000);
            petB.sprite.setTint(0xff0000);
            agentB.sprite.setAngle(90);
            petB.sprite.setAngle(90);

            this.dialogueBox.show('Victory! You found Loot!', true);
        } else {
            agentA.sprite.setTint(0xff0000);
            petA.sprite.setTint(0xff0000);
            agentA.sprite.setAngle(90);
            petA.sprite.setAngle(90);

            this.dialogueBox.show('Defeat! The enemy overpowers you.', true);
        }

        this.time.delayedCall(3000, () => {
            this.dialogueBox.hide();
            this.isBattling = false;
        });
    }

    createPhilosophers(map: Phaser.Tilemaps.Tilemap, layers: any) {
        const philosopherConfigs = [
            { id: "socrates", name: "Socrates", defaultDirection: "right", roamRadius: 800, defaultMessage: "I know that I know nothing." },
            { id: "aristotle", name: "Aristotle", defaultDirection: "right", roamRadius: 700, defaultMessage: "We are what we repeatedly do. Excellence, then, is not an act, but a habit." },
            { id: "plato", name: "Plato", defaultDirection: "front", roamRadius: 750, defaultMessage: "Love is a serious mental disease." }
        ];

        this.philosophers = [];

        philosopherConfigs.forEach(config => {
            const spawnPoint = map.findObject("Objects", (obj: any) => obj.name === config.name) || { x: 300 + Math.random() * 200, y: 300 + Math.random() * 200 };

            const char = new Character(this, {
                id: config.id,
                name: config.name,
                spawnPoint: spawnPoint,
                atlas: config.id,
                defaultDirection: config.defaultDirection,
                worldLayer: layers.worldLayer,
                defaultMessage: config.defaultMessage,
                roamRadius: config.roamRadius,
                moveSpeed: 40,
                pauseChance: 0.2,
                directionChangeChance: 0.3,
                handleCollisions: true
            });

            this.philosophers.push(char);
        });

        // Make all philosopher labels visible initially
        this.togglePhilosopherLabels(true);

        // Add collisions between philosophers
        for (let i = 0; i < this.philosophers.length; i++) {
            for (let j = i + 1; j < this.philosophers.length; j++) {
                this.physics.add.collider(
                    this.philosophers[i].sprite,
                    this.philosophers[j].sprite
                );
            }
        }
    }

    checkPhilosopherInteraction() {
        let nearbyPhilosopher: Character | null = null;

        for (const philosopher of this.philosophers) {
            if (philosopher.isPlayerNearby(this.player!)) {
                nearbyPhilosopher = philosopher;
                break;
            }
        }

        if (nearbyPhilosopher) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                if (!this.dialogueBox.isVisible()) {
                    this.dialogueManager.startDialogue(nearbyPhilosopher);
                } else if (!this.dialogueManager.isTyping) {
                    this.dialogueManager.continueDialogue();
                }
            }

            if (this.dialogueBox.isVisible()) {
                nearbyPhilosopher.facePlayer(this.player!);
            }
        } else if (this.dialogueBox.isVisible()) {
            this.dialogueManager.closeDialogue();
        }
    }

    createTilemap() {
        return this.make.tilemap({ key: "map" });
    }

    addTileset(map: Phaser.Tilemaps.Tilemap) {
        const tuxmonTileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tuxmon-tiles");
        const greeceTileset = map.addTilesetImage("ancient_greece_tileset", "greece-tiles");
        const plantTileset = map.addTilesetImage("plant", "plant-tiles");

        return [tuxmonTileset, greeceTileset, plantTileset];
    }

    createLayers(map: Phaser.Tilemaps.Tilemap, tilesets: any) {
        const belowLayer = map.createLayer("Below Player", tilesets, 0, 0);
        const worldLayer = map.createLayer("World", tilesets, 0, 0);
        const aboveLayer = map.createLayer("Above Player", tilesets, 0, 0);
        worldLayer?.setCollisionByProperty({ collides: true });
        aboveLayer?.setDepth(10);
        return { belowLayer, worldLayer, aboveLayer };
    }

    setupPlayer(map: Phaser.Tilemaps.Tilemap, worldLayer: Phaser.Tilemaps.TilemapLayer) {
        let spawnPoint = map.findObject("Objects", (obj: any) => obj.name === "Spawn Point");
        if (!spawnPoint) {
            spawnPoint = { x: 400, y: 400 } as any;
        }

        this.player = this.physics.add.sprite(spawnPoint!.x!, spawnPoint!.y!, "sophia", "sophia-front")
            .setSize(30, 40)
            .setOffset(0, 6);

        this.physics.add.collider(this.player, worldLayer);

        this.philosophers.forEach(philosopher => {
            this.physics.add.collider(this.player!, philosopher.sprite);
        });

        this.createPlayerAnimations();

        // Set world bounds for physics
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBoundsCollision(true, true, true, true);
    }

    createPlayerAnimations() {
        const anims = this.anims;
        const animConfig = [
            { key: "sophia-left-walk", prefix: "sophia-left-walk-" },
            { key: "sophia-right-walk", prefix: "sophia-right-walk-" },
            { key: "sophia-front-walk", prefix: "sophia-front-walk-" },
            { key: "sophia-back-walk", prefix: "sophia-back-walk-" }
        ];

        animConfig.forEach(config => {
            anims.create({
                key: config.key,
                frames: anims.generateFrameNames("sophia", { prefix: config.prefix, start: 0, end: 8, zeroPad: 4 }),
                frameRate: 10,
                repeat: -1,
            });
        });
    }

    setupCamera(map: Phaser.Tilemaps.Tilemap) {
        const camera = this.cameras.main;
        camera.startFollow(this.player!);
        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        return camera;
    }

    setupControls(camera: Phaser.Cameras.Scene2D.Camera) {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasdKeys = {
            up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };

        this.labelsVisible = true;

        // Add ESC key for pause menu
        this.input.keyboard!.on('keydown-ESC', () => {
            if (!this.dialogueBox.isVisible()) {
                this.scene.pause();
                this.scene.launch('PauseMenu');
            }
        });
    }

    setupDialogueSystem() {
        const screenPadding = 20;
        const maxDialogueHeight = 200;

        this.dialogueBox = new DialogueBox(this);
        this.dialogueText = this.add
            .text(60, this.game.config.height as number - maxDialogueHeight - screenPadding + screenPadding, '', {
                font: "18px monospace",
                color: "#ffffff",
                padding: { x: 20, y: 10 },
                wordWrap: { width: 680 },
                lineSpacing: 6,
                maxLines: 5
            })
            .setScrollFactor(0)
            .setDepth(30)
            .setVisible(false);

        this.spaceKey = this.input.keyboard!.addKey('SPACE');

        this.dialogueManager = new DialogueManager(this);
        this.dialogueManager.initialize(this.dialogueBox);
    }

    update(time: number, delta: number) {
        const isInDialogue = this.dialogueBox.isVisible();

        if (!isInDialogue) {
            this.updatePlayerMovement();
        }

        this.checkPhilosopherInteraction();

        this.philosophers.forEach(philosopher => {
            philosopher.update(this.player!, isInDialogue);
        });


    }

    updatePlayerMovement() {
        const speed = 175;
        const prevVelocity = this.player!.body!.velocity.clone();
        this.player!.setVelocity(0);

        const leftDown = this.cursors!.left.isDown || this.wasdKeys.left.isDown;
        const rightDown = this.cursors!.right.isDown || this.wasdKeys.right.isDown;
        const upDown = this.cursors!.up.isDown || this.wasdKeys.up.isDown;
        const downDown = this.cursors!.down.isDown || this.wasdKeys.down.isDown;

        if (leftDown) {
            this.player!.setVelocityX(-speed);
        } else if (rightDown) {
            this.player!.setVelocityX(speed);
        }

        if (upDown) {
            this.player!.setVelocityY(-speed);
        } else if (downDown) {
            this.player!.setVelocityY(speed);
        }

        this.player!.body!.velocity.normalize().scale(speed);

        const currentVelocity = this.player!.body!.velocity;
        const isMoving = Math.abs(currentVelocity.x) > 0 || Math.abs(currentVelocity.y) > 0;

        if (leftDown && isMoving) {
            this.player!.anims.play("sophia-left-walk", true);
        } else if (rightDown && isMoving) {
            this.player!.anims.play("sophia-right-walk", true);
        } else if (upDown && isMoving) {
            this.player!.anims.play("sophia-back-walk", true);
        } else if (downDown && isMoving) {
            this.player!.anims.play("sophia-front-walk", true);
        } else {
            this.player!.anims.stop();
            if (prevVelocity.x < 0) this.player!.setTexture("sophia", "sophia-left");
            else if (prevVelocity.x > 0) this.player!.setTexture("sophia", "sophia-right");
            else if (prevVelocity.y < 0) this.player!.setTexture("sophia", "sophia-back");
            else if (prevVelocity.y > 0) this.player!.setTexture("sophia", "sophia-front");
            else {
                // If prevVelocity is zero, maintain current direction
                const currentFrame = this.player!.frame.name;

                let direction = "front";

                if (currentFrame.includes("left")) direction = "left";
                else if (currentFrame.includes("right")) direction = "right";
                else if (currentFrame.includes("back")) direction = "back";
                else if (currentFrame.includes("front")) direction = "front";

                this.player!.setTexture("sophia", `sophia-${direction}`);
            }
        }
    }

    togglePhilosopherLabels(visible: boolean) {
        this.philosophers.forEach(philosopher => {
            if (philosopher.nameLabel) {
                philosopher.nameLabel.setVisible(visible);
            }
        });
    }
}
