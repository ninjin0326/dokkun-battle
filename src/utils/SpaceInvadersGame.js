class SpaceInvadersGame {
    constructor(options = {}) {
        this.canvas = null;
        this.gameWidth = 800;
        this.gameHeight = 600;
        
        // コールバック関数
        this.onStateChange = options.onStateChange || (() => {});
        this.onScoreChange = options.onScoreChange || (() => {});
        this.onLivesChange = options.onLivesChange || (() => {});
        this.onGameTimeChange = options.onGameTimeChange || (() => {});
        this.onBeatDetected = options.onBeatDetected || (() => {});
        
        // ゲーム状態
        this.gameState = 'menu'; // menu, preparation, playing, paused, gameOver, win
        this.score = 0;
        this.lives = 3;
        this.isPaused = false;
        
        // 準備時間用
        this.preparationTime = 10;
        this.preparationTimer = 0;
        this.preparationStartTime = 0;
        
        // プレイヤー
        this.player = {
            x: 400,
            y: 550,
            width: 40,
            height: 30,
            speed: 5,
            invulnerable: false,
            invulnerableTime: 0,
            collisionBoxes: [
                { x: -10, y: -8, width: 20, height: 16 },
                { x: -4, y: -12, width: 8, height: 8 },
                { x: -14, y: -10, width: 6, height: 8 },
                { x: 8, y: -10, width: 6, height: 8 }
            ]
        };
        
        // 弾丸配列
        this.playerBullets = [];
        this.enemyBullets = [];
        
        // 敵配列
        this.enemies = [];
        this.boss = null;
        
        // エフェクト
        this.explosions = [];
        this.stars = [];
        
        // ボス登場フラグ
        this.bossSpawning = false;
        
        // キー入力
        this.keys = {};
        
        // タイミング
        this.lastTime = 0;
        this.enemyShootTimer = 0;
        this.enemyMoveTimer = 0;
        this.enemyDirection = 1;
        
        // 時間ベーススコア用
        this.gameStartTime = 0;
        this.gameTime = 0;
        
        // 心拍関連
        this.threshold = options.threshold || 1800;
        this.dataArray = [];
        this.prevFiltered = 0;
        this.alpha = 0.4;
        this.beatCount = 0;
        this.lastBeatTime = 0;
        this.aboveThreshold = false;
        
        // デバッグ用
        this.showCollisionBoxes = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateLives();
        this.updateScore();
    }
    
    setCanvas(canvasElement) {
        this.canvas = canvasElement;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyP') {
                e.preventDefault();
                this.togglePause();
            }
            
            if (e.code === 'KeyC') {
                e.preventDefault();
                this.showCollisionBoxes = !this.showCollisionBoxes;
            }
            
            if (e.code === 'Enter' && (this.gameState === 'gameOver' || this.gameState === 'win')) {
                e.preventDefault();
                this.restartGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    startGame() {
        if (this.gameState === 'menu') {
            this.showPreparationScreen();
        }
    }
    
    showPreparationScreen() {
        this.gameState = 'preparation';
        this.preparationTime = 10;
        this.preparationStartTime = Date.now();
        this.onStateChange(this.gameState);
        
        // カウントダウン開始
        const countdownInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.preparationStartTime) / 1000);
            this.preparationTime = Math.max(0, 10 - elapsed);
            
            if (this.preparationTime <= 0) {
                clearInterval(countdownInterval);
                this.endPreparation();
            }
        }, 100);
    }
    
    endPreparation() {
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        this.onStateChange(this.gameState);
        this.createLevel();
        this.gameLoop();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.isPaused = true;
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.isPaused = false;
        }
        this.onStateChange(this.gameState);
    }
    
    createLevel() {
        this.enemies = [];
        this.clearEnemies();
        
        const rows = 2;
        const cols = 6;
        const enemyWidth = 40;
        const enemyHeight = 35;
        const spacing = 80;
        const startX = 200;
        const startY = 80;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const enemy = {
                    x: startX + col * spacing,
                    y: startY + row * spacing,
                    width: enemyWidth,
                    height: enemyHeight,
                    type: row < 1 ? 'weak' : 'normal',
                    health: 0.5
                };
                
                this.enemies.push(enemy);
                this.createEnemySVG(enemy);
            }
        }
        
        this.boss = null;
        console.log('レベル作成完了');
    }
    
    createEnemySVG(enemy) {
        if (!this.canvas) return;
        
        const enemiesGroup = this.canvas.querySelector('#enemies');
        if (!enemiesGroup) return;
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'enemy-ship');
        g.setAttribute('transform', `translate(${enemy.x - enemy.width/2}, ${enemy.y - enemy.height/2})`);
        
        // フォールバック図形を作成
        g.innerHTML = `
            <polygon points="20,0 0,20 7,27 33,27 40,20" fill="#ff4444" stroke="#cc0000" stroke-width="1"/>
            <circle cx="10" cy="12" r="2" fill="#ffff00"/>
            <circle cx="30" cy="12" r="2" fill="#ffff00"/>
        `;
        
        enemiesGroup.appendChild(g);
        enemy.element = g;
    }
    
    createPlayerSVG() {
        if (!this.canvas) return;
        
        const playerGroup = this.canvas.querySelector('#player');
        if (!playerGroup) return;
        
        playerGroup.innerHTML = '';
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'player-ship');
        g.setAttribute('transform', `translate(${this.player.x - this.player.width/2}, ${this.player.y - this.player.height/2})`);
        
        // フォールバック図形を作成
        g.innerHTML = `
            <polygon points="20,0 0,30 40,30" fill="#00ff00" stroke="#00cc00" stroke-width="1"/>
            <circle cx="20" cy="15" r="3" fill="#ffffff"/>
        `;
        
        playerGroup.appendChild(g);
        this.player.element = g;
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        if (this.isPaused) return;
        
        this.updateGameTime();
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies(deltaTime);
        this.updateBoss(deltaTime);
        this.checkCollisions();
        this.checkBossSpawn();
        this.checkWinCondition();
    }
    
    updateGameTime() {
        if (this.gameStartTime > 0) {
            this.gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
            this.onGameTimeChange(this.gameTime);
        }
    }
    
    updatePlayer() {
        if (this.keys['ArrowLeft'] && this.player.x > this.player.width / 2) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] && this.player.x < this.gameWidth - this.player.width / 2) {
            this.player.x += this.player.speed;
        }
        
        // プレイヤー位置を更新
        if (this.player.element) {
            this.player.element.setAttribute('transform', 
                `translate(${this.player.x - this.player.width/2}, ${this.player.y - this.player.height/2})`);
        }
        
        // 無敵時間の処理
        if (this.player.invulnerable) {
            this.player.invulnerableTime -= 16;
            if (this.player.invulnerableTime <= 0) {
                this.player.invulnerable = false;
                if (this.player.element) {
                    this.player.element.classList.remove('damaged');
                }
            }
        }
    }
    
    updateBullets() {
        // プレイヤーの弾丸更新
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            bullet.y -= bullet.speed;
            
            if (bullet.element) {
                bullet.element.setAttribute('transform', `translate(${bullet.x - 2}, ${bullet.y - 2})`);
            }
            
            if (bullet.y < 0) {
                if (bullet.element) {
                    bullet.element.remove();
                }
                this.playerBullets.splice(i, 1);
            }
        }
        
        // 敵の弾丸更新
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.y += bullet.speed;
            
            if (bullet.element) {
                bullet.element.setAttribute('transform', `translate(${bullet.x - 2}, ${bullet.y - 2})`);
            }
            
            if (bullet.y > this.gameHeight) {
                if (bullet.element) {
                    bullet.element.remove();
                }
                this.enemyBullets.splice(i, 1);
            }
        }
    }
    
    updateEnemies(deltaTime) {
        this.enemyMoveTimer += deltaTime;
        if (this.enemyMoveTimer > 1000) {
            this.enemyMoveTimer = 0;
            this.moveEnemies();
        }
        
        this.enemyShootTimer += deltaTime;
        if (this.enemyShootTimer > 2000 && this.enemies.length > 0) {
            this.enemyShootTimer = 0;
            const randomEnemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
            this.enemyShoot(randomEnemy);
        }
    }
    
    moveEnemies() {
        let shouldMoveDown = false;
        
        for (const enemy of this.enemies) {
            enemy.x += this.enemyDirection * 20;
            
            if (enemy.x <= 50 || enemy.x >= this.gameWidth - 50) {
                shouldMoveDown = true;
            }
        }
        
        if (shouldMoveDown) {
            this.enemyDirection *= -1;
            for (const enemy of this.enemies) {
                enemy.y += 30;
                
                if (enemy.element) {
                    enemy.element.setAttribute('transform', 
                        `translate(${enemy.x - enemy.width/2}, ${enemy.y - enemy.height/2})`);
                }
            }
        } else {
            for (const enemy of this.enemies) {
                if (enemy.element) {
                    enemy.element.setAttribute('transform', 
                        `translate(${enemy.x - enemy.width/2}, ${enemy.y - enemy.height/2})`);
                }
            }
        }
    }
    
    updateBoss(deltaTime) {
        if (!this.boss) return;
        
        this.boss.x += this.boss.moveDirection * 2;
        
        if (this.boss.x <= this.boss.width/2 || this.boss.x >= this.gameWidth - this.boss.width/2) {
            this.boss.moveDirection *= -1;
        }
        
        if (this.boss.element) {
            this.boss.element.setAttribute('transform', 
                `translate(${this.boss.x - this.boss.width/2}, ${this.boss.y - this.boss.height/2})`);
        }
        
        this.boss.shootTimer += deltaTime;
        if (this.boss.shootTimer > 1500) {
            this.boss.shootTimer = 0;
            this.bossShoot();
        }
    }
    
    enemyShoot(enemy) {
        const bullet = {
            x: enemy.x,
            y: enemy.y + enemy.height/2,
            speed: 3
        };
        
        this.enemyBullets.push(bullet);
        this.createBulletSVG(bullet, '#ff4444');
    }
    
    bossShoot() {
        if (!this.boss) return;
        
        for (let i = 0; i < 3; i++) {
            const bullet = {
                x: this.boss.x + (i - 1) * 20,
                y: this.boss.y + this.boss.height/2,
                speed: 4
            };
            
            this.enemyBullets.push(bullet);
            this.createBulletSVG(bullet, '#ff00ff');
        }
    }
    
    shoot() {
        const bullet = {
            x: this.player.x,
            y: this.player.y - this.player.height/2,
            speed: 8
        };
        
        this.playerBullets.push(bullet);
        this.createBulletSVG(bullet, '#00ffff');
    }
    
    createBulletSVG(bullet, color) {
        if (!this.canvas) return;
        
        const bulletsGroup = bullet.speed > 5 ? 
            this.canvas.querySelector('#playerBullets') : 
            this.canvas.querySelector('#enemyBullets');
        
        if (!bulletsGroup) return;
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '2');
        circle.setAttribute('cy', '2');
        circle.setAttribute('r', '2');
        circle.setAttribute('fill', color);
        circle.setAttribute('class', 'bullet');
        circle.setAttribute('transform', `translate(${bullet.x - 2}, ${bullet.y - 2})`);
        
        bulletsGroup.appendChild(circle);
        bullet.element = circle;
    }
    
    checkCollisions() {
        // プレイヤーの弾丸と敵の衝突
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            
            // 敵との衝突
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.isColliding(bullet, enemy)) {
                    // 爆発エフェクト
                    this.createExplosion(enemy.x, enemy.y);
                    
                    // 弾丸削除
                    if (bullet.element) bullet.element.remove();
                    this.playerBullets.splice(i, 1);
                    
                    // 敵削除
                    if (enemy.element) enemy.element.remove();
                    this.enemies.splice(j, 1);
                    
                    this.score += 10;
                    this.onScoreChange(this.score);
                    break;
                }
            }
            
            // ボスとの衝突
            if (this.boss && this.isColliding(bullet, this.boss)) {
                this.boss.health -= 1;
                
                // 体力バー更新
                const healthBar = this.boss.element?.querySelector('.boss-health-bar');
                if (healthBar) {
                    const healthRatio = this.boss.health / this.boss.maxHealth;
                    healthBar.setAttribute('width', 60 * healthRatio);
                }
                
                // 弾丸削除
                if (bullet.element) bullet.element.remove();
                this.playerBullets.splice(i, 1);
                
                if (this.boss.health <= 0) {
                    this.createExplosion(this.boss.x, this.boss.y);
                    if (this.boss.element) this.boss.element.remove();
                    this.boss = null;
                    this.score += 100;
                    this.onScoreChange(this.score);
                }
                break;
            }
        }
        
        // 敵の弾丸とプレイヤーの衝突
        if (!this.player.invulnerable) {
            for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                const bullet = this.enemyBullets[i];
                
                if (this.isCollidingWithPlayer(bullet)) {
                    // 弾丸削除
                    if (bullet.element) bullet.element.remove();
                    this.enemyBullets.splice(i, 1);
                    
                    // プレイヤーダメージ
                    this.playerDamageEffect();
                    break;
                }
            }
        }
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width/2 &&
               obj1.x + 4 > obj2.x - obj2.width/2 &&
               obj1.y < obj2.y + obj2.height/2 &&
               obj1.y + 4 > obj2.y - obj2.height/2;
    }
    
    isCollidingWithPlayer(obj) {
        return obj.x < this.player.x + this.player.width/2 &&
               obj.x + 4 > this.player.x - this.player.width/2 &&
               obj.y < this.player.y + this.player.height/2 &&
               obj.y + 4 > this.player.y - this.player.height/2;
    }
    
    createExplosion(x, y) {
        const explosionsGroup = this.canvas?.querySelector('#explosions');
        if (!explosionsGroup) return;
        
        const explosion = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        explosion.setAttribute('cx', x);
        explosion.setAttribute('cy', y);
        explosion.setAttribute('r', '0');
        explosion.setAttribute('fill', '#ffaa00');
        explosion.setAttribute('class', 'explosion');
        
        explosionsGroup.appendChild(explosion);
        
        // アニメーション
        let radius = 0;
        const animate = () => {
            radius += 2;
            explosion.setAttribute('r', radius);
            explosion.setAttribute('fill-opacity', Math.max(0, 1 - radius / 30));
            
            if (radius < 30) {
                requestAnimationFrame(animate);
            } else {
                explosion.remove();
            }
        };
        animate();
    }
    
    playerDamageEffect() {
        this.lives -= 1;
        this.onLivesChange(this.lives);
        
        if (this.lives <= 0) {
            this.gameOver();
            return;
        }
        
        this.player.invulnerable = true;
        this.player.invulnerableTime = 2000;
        
        if (this.player.element) {
            this.player.element.classList.add('damaged');
        }
    }
    
    checkBossSpawn() {
        if (!this.boss && !this.bossSpawning && this.enemies.length <= 3) {
            this.bossSpawning = true;
            this.createBoss();
        }
    }
    
    createBoss() {
        this.boss = {
            x: this.gameWidth / 2,
            y: 100,
            width: 80,
            height: 60,
            health: 8,
            maxHealth: 8,
            moveDirection: 1,
            shootTimer: 0
        };
        
        this.createBossSVG();
    }
    
    createBossSVG() {
        if (!this.canvas) return;
        
        const enemiesGroup = this.canvas.querySelector('#enemies');
        if (!enemiesGroup) return;
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'boss-ship');
        g.setAttribute('transform', `translate(${this.boss.x - this.boss.width/2}, ${this.boss.y - this.boss.height/2})`);
        
        // フォールバック図形
        g.innerHTML = `
            <polygon points="40,0 10,20 0,30 15,50 25,60 55,60 65,50 80,30 70,20" fill="#ff00ff" stroke="#cc00cc" stroke-width="2"/>
            <polygon points="20,30 30,35 50,35 60,30 40,45" fill="#aa00aa"/>
            <circle cx="25" cy="20" r="3" fill="#ffff00"/>
            <circle cx="55" cy="20" r="3" fill="#ffff00"/>
            <circle cx="40" cy="25" r="4" fill="#ff0000"/>
        `;
        
        this.addBossHealthBar(g);
        enemiesGroup.appendChild(g);
        this.boss.element = g;
    }
    
    addBossHealthBar(parentG) {
        const healthBarBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        healthBarBg.setAttribute('x', '10');
        healthBarBg.setAttribute('y', this.boss.height + 5);
        healthBarBg.setAttribute('width', '60');
        healthBarBg.setAttribute('height', '4');
        healthBarBg.setAttribute('fill', '#333');
        healthBarBg.setAttribute('stroke', '#fff');
        healthBarBg.setAttribute('stroke-width', '0.5');
        
        const healthBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        healthBar.setAttribute('class', 'boss-health-bar');
        healthBar.setAttribute('x', '10');
        healthBar.setAttribute('y', this.boss.height + 5);
        healthBar.setAttribute('width', 60 * (this.boss.health / this.boss.maxHealth));
        healthBar.setAttribute('height', '4');
        healthBar.setAttribute('fill', '#ff0000');
        
        parentG.appendChild(healthBarBg);
        parentG.appendChild(healthBar);
    }
    
    checkWinCondition() {
        if (this.enemies.length === 0 && !this.boss) {
            this.gameWin();
        }
    }
    
    gameWin() {
        this.gameState = 'win';
        this.onStateChange(this.gameState);
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.onStateChange(this.gameState);
    }
    
    restartGame() {
        this.gameState = 'menu';
        this.score = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.beatCount = 0;
        this.preparationTime = 10;
        
        this.clearBullets();
        this.clearEnemies();
        
        this.onStateChange(this.gameState);
        this.onScoreChange(this.score);
        this.onLivesChange(this.lives);
        this.onGameTimeChange(this.gameTime);
    }
    
    clearBullets() {
        if (!this.canvas) return;
        
        const playerBullets = this.canvas.querySelector('#playerBullets');
        const enemyBullets = this.canvas.querySelector('#enemyBullets');
        
        if (playerBullets) playerBullets.innerHTML = '';
        if (enemyBullets) enemyBullets.innerHTML = '';
        
        this.playerBullets = [];
        this.enemyBullets = [];
    }
    
    clearEnemies() {
        if (!this.canvas) return;
        
        const enemies = this.canvas.querySelector('#enemies');
        if (enemies) enemies.innerHTML = '';
        
        this.enemies = [];
        this.boss = null;
        this.bossSpawning = false;
    }
    
    updateScore() {
        this.onScoreChange(this.score);
    }
    
    updateLives() {
        this.onLivesChange(this.lives);
    }
    
    // 心拍関連メソッド
    onHeartBeat() {
        if (this.gameState === 'playing') {
            this.shoot();
        }
    }
    
    updateHeartData(data) {
        this.dataArray.push(data);
        if (this.dataArray.length > 100) {
            this.dataArray.shift();
        }
    }
    
    setThreshold(threshold) {
        this.threshold = threshold;
    }
}

export default SpaceInvadersGame; 