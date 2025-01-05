const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 900,
  parent: "game-container",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);
let cursors;
let wasdKeys;
let player;
let showDebug = false;
let timeOfDay = 0;
let scoreText;
let score = 0;
let collectables;

function preload() {
  this.load.image("tiles", "32px-pokemoni.png");
  this.load.tilemapTiledJSON("map", "tiled.tmj");
  this.load.atlas("atlas", "killjoy.png", "killjoy.json");
  this.load.image('pokeball', 'https://labs.phaser.io/assets/sprites/orb-red.png');
}

function createRandomPokeballs(scene, map) {
  collectables = scene.physics.add.group();
  
  // Create 15 pokeballs in random positions
  for (let i = 0; i < 15; i++) {
    const x = Phaser.Math.Between(100, map.widthInPixels - 100);
    const y = Phaser.Math.Between(100, map.heightInPixels - 100);
    
    const pokeball = collectables.create(x, y, 'pokeball');
    pokeball.setScale(0.5);
    pokeball.setBounceY(0.2);
    pokeball.setDepth(50);
  }
}

function create() {
  const map = this.make.tilemap({ key: "map" });
  const tileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");
  
  const belowLayer = map.createLayer("Below Player", tileset, 0, 0);
  const worldLayer = map.createLayer("World", tileset, 0, 0);
  const aboveLayer = map.createLayer("Above Player", tileset, 0, 0);

  worldLayer.setCollisionByProperty({ collides: true });
  aboveLayer.setDepth(10);

  const spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");
  player = this.physics.add
    .sprite(spawnPoint ? spawnPoint.x : 100, spawnPoint ? spawnPoint.y : 100, "atlas", "misa-front")
    .setSize(30, 40)
    .setOffset(0, 24);

  // Create randomly placed pokeballs
  createRandomPokeballs(this, map);
  
  this.physics.add.collider(player, worldLayer);
  this.physics.add.overlap(player, collectables, collectPokeball, null, this);

  // Setup animations
  const anims = this.anims;
  anims.create({
    key: "misa-left-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-left-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "misa-right-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-right-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "misa-front-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-front-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "misa-back-walk",
    frames: anims.generateFrameNames("atlas", { prefix: "misa-back-walk.", start: 0, end: 3, zeroPad: 3 }),
    frameRate: 10,
    repeat: -1
  });

  const camera = this.cameras.main;
  camera.startFollow(player);
  camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

  // Setup UI
  scoreText = this.add.text(16, 16, 'Score: 0', {
    font: "18px monospace",
    fill: "#000000",
    padding: { x: 20, y: 10 },
    backgroundColor: "#ffffff"
  })
  .setScrollFactor(0)
  .setDepth(100);

  const helpText = this.add.text(16, 50, 'Arrow keys or WASD to move\nCollect the pokeballs!', {
    font: "18px monospace",
    fill: "#000000",
    padding: { x: 20, y: 10 },
    backgroundColor: "#ffffff"
  })
  .setScrollFactor(0)
  .setDepth(100);

  cursors = this.input.keyboard.createCursorKeys();
  wasdKeys = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D
  });
}

function collectPokeball(player, pokeball) {
  pokeball.disableBody(true, true);
  score += 10;
  scoreText.setText('Score: ' + score);
}

function update(time, delta) {
  const speed = 175;
  const prevVelocity = player.body.velocity.clone();
  player.body.setVelocity(0);

  // Handle both arrow keys and WASD
  if (cursors.left.isDown || wasdKeys.left.isDown) {
    player.body.setVelocityX(-speed);
  } else if (cursors.right.isDown || wasdKeys.right.isDown) {
    player.body.setVelocityX(speed);
  }

  if (cursors.up.isDown || wasdKeys.up.isDown) {
    player.body.setVelocityY(-speed);
  } else if (cursors.down.isDown || wasdKeys.down.isDown) {
    player.body.setVelocityY(speed);
  }

  // Normalize and scale the velocity so that player can't move faster along a diagonal
  player.body.velocity.normalize().scale(speed);

  // Update animations based on movement
  if (cursors.left.isDown || wasdKeys.left.isDown) {
    player.anims.play("misa-left-walk", true);
  } else if (cursors.right.isDown || wasdKeys.right.isDown) {
    player.anims.play("misa-right-walk", true);
  } else if (cursors.up.isDown || wasdKeys.up.isDown) {
    player.anims.play("misa-back-walk", true);
  } else if (cursors.down.isDown || wasdKeys.down.isDown) {
    player.anims.play("misa-front-walk", true);
  } else {
    player.anims.stop();
    // Set idle frame
    if (prevVelocity.x < 0) player.setTexture("atlas", "misa-left");
    else if (prevVelocity.x > 0) player.setTexture("atlas", "misa-right");
    else if (prevVelocity.y < 0) player.setTexture("atlas", "misa-back");
    else if (prevVelocity.y > 0) player.setTexture("atlas", "misa-front");
  }

  // Update collectable animations
  collectables.children.iterate(function (child) {
    if (child && child.active) {
      child.rotation += 0.02;
    }
  });
}