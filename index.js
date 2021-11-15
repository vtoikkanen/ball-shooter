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

class ProjectileImage {
    constructor() {

    }
}

/* Projectile (bullet) that the player shoots */
class Projectile {
    constructor(x, y, radius, color, velocity, projectileAngle) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.initialVelocity = true;
        this.projectileAngle = projectileAngle;
    }

    draw() {
        /*
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore()
        */

        const pint = new Image();
        pint.src = "pint.png";
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.projectileAngle);
        c.translate(-this.x, -this.y);
        c.drawImage(pint, this.x, this.y, 15, 50);
        c.restore();
    }

    update() {
        this.draw();
        this.x = this.x + (this.velocity.x * (this.initialVelocity ? 12 : 1));
        this.y = this.y + (this.velocity.y * (this.initialVelocity ? 12 : 1));
        this.initialVelocity = false;
    }
}

/* Enemy */
class Enemy {
    constructor(x, y, radius, color, velocity, enemyAngle) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.enemyAngle = enemyAngle;
    }

    draw() {
        /*
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        */

        const meteor = new Image();
        meteor.src = "meteor.png";
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.enemyAngle);
        c.translate(-this.x, -this.y);
        c.drawImage(meteor, this.x, this.y, this.radius, this.radius);
        c.restore();
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
        /*
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
        */
        const meteor = new Image();
        meteor.src = "meteor.png";
        c.save();
        c.translate(this.x, this.y);
        c.rotate(360);
        c.translate(-this.x, -this.y);
        c.drawImage(meteor, this.x, this.y, this.radius, this.radius);
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
const player = new Player(x, y, 50, "white");

/* Defining projectiles/bullets and enemies arrays */
const projectiles = [];
const enemies = [];
const particles = [];

function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (60 - 20) + 20;
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

        const min = 10;
        const max = 30;
        const randomGray = Math.floor(Math.random() * (max - min) + min) + "%";
        const color = `hsl(0, 0%, ${randomGray})`;

        const angle = Math.atan2(
            canvas.height / 2 - y,
            canvas.width / 2 - x
        );
        const velocity = {
            x: Math.cos(angle) * multiplier,
            y: Math.sin(angle) * multiplier
        };

        const enemyAngle = Math.atan2(
            x - (canvas.width / 2),
            -(y - (canvas.height / 2))
        );
        const newEnemy = new Enemy(x, y, radius, color, velocity, enemyAngle);
        enemies.push(newEnemy);
    }, 500);
}

/* Function to animate */
let animationId;
function animate() {
    animationId = requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);
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
            for (let i = 0; i < enemy.radius / 5; i++) {
                particles.push(new Particle(enemy.x, enemy.y, 10, enemy.color, {
                    x: (Math.random() - 0.5) * (Math.random() * 6),
                    y: (Math.random() - 0.5) * (Math.random() * 6)
                }));
            }
            setTimeout(() => {
                1
                enemies.splice(enemyIndex, 1);
            }, 0);


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
                for (let i = 0; i < enemy.radius / 5; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, 10, enemy.color, {
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
    const speedMultiplier = 5;
    const velocity = {
        x: Math.cos(angle) * speedMultiplier, // Multiplication fastens projectiles
        y: Math.sin(angle) * speedMultiplier // Multiplication fastens projectiles
    };
    const projectileAngle = Math.atan2(
        event.clientX - (canvas.width / 2),
        -(event.clientY - (canvas.height / 2))
    );
    const newProjectile = new Projectile(canvas.width / 2, canvas.height / 2, 20, "white", velocity, projectileAngle);

    projectiles.push(newProjectile);
});

animate();
spawnEnemies();