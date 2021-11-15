const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

/* My custom stuff */
let score = 0;
let multiplier = 1;
const scoreElement = document.getElementById("scoreElement");

function multiplierIncrease() {
    setInterval(() => {
        multiplier = multiplier + 0.1;
    }, 5000);
}

multiplierIncrease();

/* Set canvas HTML object size */
canvas.width = innerWidth;
canvas.height = innerHeight;

/* Player */
class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}

/* Projectile / bullet that the player shoots */
class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

/* Enemy */
class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

/* Enemy particle thing in enemy death */
const friction = 0.99;
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= friction; // Slow down particles
        this.velocity.y *= friction; // Slow down particles
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}

/* Create a player and assign it in the middle (not drawing yet) */
const x = canvas.width / 2;
const y = canvas.height / 2;
const player = new Player(x, y, 10, "white");

/* Defining projectiles/bullets and enemies arrays */
const projectiles = [];
const enemies = [];
const particles = [];

function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (30 - 4) + 4;
        let x;
        let y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        }
        else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

        const angle = Math.atan2(
            canvas.height / 2 - y,
            canvas.width / 2 - x
        );
        const velocity = {
            x: Math.cos(angle) * multiplier,
            y: Math.sin(angle) * multiplier
        };

        const newEnemy = new Enemy(x, y, radius, color, velocity);
        enemies.push(newEnemy);
    }, 500);
}

/* Function to animate */
let animationId;
function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0,0,0,.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();

    particles.forEach((particle, particleIndex) => {
        if (particle.alpha <= 0) {
            particles.splice(particleIndex, 1);
        }
        else {
            particle.update();
        }
    });

    projectiles.forEach((projectile, projectileIndex) => {
        projectile.update();

        // Remove from edges of the screen
        if (
            projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => {
                projectiles.splice(projectileIndex, 1);
            }, 0);
        }
    });

    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();

        // End game
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            document.getElementById("overlay").style.display = "block";
            document.getElementById("finalScore").innerText = "Final score: " + score;
            document.getElementById("button").addEventListener("click", () => {
                window.location.reload();
            });
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            // When projectiles touch enemy
            if (dist - enemy.radius - projectile.radius < 1) {
                // Create explosions
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 6),
                        y: (Math.random() - 0.5) * (Math.random() * 6)
                    }));
                }

                setTimeout(() => {
                    enemies.splice(enemyIndex, 1);
                    projectiles.splice(projectileIndex, 1);
                    score++;
                    scoreElement.innerHTML = "SCORE: " + score;
                }, 0);

                /* This code makes enemy smaller when hitting, I don't like it
                if (enemy.radius - 10 > 5) {
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    });
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                }
                else {
                    setTimeout(() => {
                        enemies.splice(enemyIndex, 1);
                        projectiles.splice(projectileIndex, 1);
                        score++;
                        scoreElement.innerHTML = "SCORE: " + score;
                    }, 0);
                }
                */
            }
        });
    });
}
/* Spawn new projectile/bullet on click */
window.addEventListener("click", (event) => {
    const y = event.clientY - canvas.height / 2;
    const x = event.clientX - canvas.width / 2;
    const angle = Math.atan2(y, x);
    const velocity = {
        x: Math.cos(angle) * 5, // Multiplication fastens projectiles
        y: Math.sin(angle) * 5 // Multiplication fastens projectiles
    };
    const newProjectile = new Projectile(canvas.width / 2, canvas.height / 2, 5, "white", velocity);

    projectiles.push(newProjectile);
});

animate();
spawnEnemies();