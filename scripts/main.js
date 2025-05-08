const { world, system, MinecraftEntityTypes } = require('@minecraft/server');

let gameConfig = {
    minutes: 30,
    seconds: 0,
    gameActive: false
};

// Start the game timer
let gameTimer = null;

function startGame() {
    gameConfig.gameActive = true;
    let totalSeconds = gameConfig.minutes * 60 + gameConfig.seconds;
    system.runCommandAsync('title @a title {"text":"TNT Tag Start!","color":"green"}');

    gameTimer = system.runInterval(() => {
        if (totalSeconds <= 0) {
            endGame();
            return;
        }

        totalSeconds--;
        let minutesLeft = Math.floor(totalSeconds / 60);
        let secondsLeft = totalSeconds % 60;
        let timeDisplay = `${minutesLeft}:${secondsLeft < 10 ? '0' + secondsLeft : secondsLeft}`;

        // Update the action bar with the time left
        world.getPlayers().forEach(player => {
            player.onScreenDisplay.setActionBar(`Time Left: ${timeDisplay}`);
        });
    }, 20);
}

// End the game and reset all players
function endGame() {
    gameConfig.gameActive = false;

    system.runCommandAsync('title @a title {"text":"TNT Tag Ended!","color":"red"}');
    world.getPlayers().forEach(player => {
        player.removeTag("explosive");
        player.runCommandAsync('clear @s');
    });

    // Stop the timer
    if (gameTimer !== null) {
        system.clearRun(gameTimer);
        gameTimer = null;
    }
}

// Handle when an entity hits another entity
world.afterEvents.entityHitEntity.subscribe(event => {
    const { damagingEntity, hitEntity } = event;

    if (!damagingEntity || !hitEntity) return;

    // Only players can hold the "explosive" tag
    if (damagingEntity.hasTag("explosive") && !hitEntity.hasTag("explosive")) {
        damagingEntity.removeTag("explosive");
        hitEntity.addTag("explosive");
        hitEntity.sendMessage("§cYou now have the explosive!");
        damagingEntity.sendMessage("§cYou lost the explosive!");
    } else if (hitEntity.hasTag("explosive") && !damagingEntity.hasTag("explosive")) {
        hitEntity.removeTag("explosive");
        damagingEntity.addTag("explosive");
        damagingEntity.sendMessage("§cYou now have the explosive!");
        hitEntity.sendMessage("§cYou lost the explosive!");
    }
});

// Handle player death
world.afterEvents.entityDeath.subscribe(event => {
    const deadEntity = event.entity;
    if (deadEntity.hasTag("explosive")) {
        // Respawn the player and reapply the "explosive" tag
        system.runCommandAsync(`tp ${deadEntity.name} ~ ~ ~`);  // Respawn the entity at the same position
        deadEntity.addTag("explosive");
        deadEntity.sendMessage("§cYou have respawned with the explosive!");
    }
});

// Command to start the game
world.afterEvents.playerUseItem.subscribe(event => {
    if (event.item.id === 'minecraft:stone_button') {
        if (!gameConfig.gameActive) {
            startGame();
        } else {
            event.player.sendMessage("§cThe game is already running.");
        }
    }
});

// Command to stop the game
world.afterEvents.playerUseItem.subscribe(event => {
    if (event.item.id === 'minecraft:wooden_button') {
        if (gameConfig.gameActive) {
            endGame();
        } else {
            event.player.sendMessage("§cThe game is not running.");
        }
    }
});
