class StatsManager {
    constructor() {
        this.storage = new StorageManager();
        this.stats = this.storage.getStats();
        this.accuracyChart = null;
        this.reactionChart = null;
    }

    ensureCharts() {
        if (!window.Chart) return;
        if (!this.accuracyChart) {
            this.initAccuracyChart();
        }
        if (!this.reactionChart) {
            this.initReactionChart();
        }
    }

    initAccuracyChart() {
        const ctx = document.getElementById('accuracyChart');
        if (!ctx || !window.Chart) return;

        this.accuracyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '准确率 (%)',
                        data: [],
                        borderColor: '#ff4d6d',
                        backgroundColor: 'rgba(255, 77, 109, 0.14)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true
                    }
                ]
            },
            options: this.getChartOptions()
        });
    }

    initReactionChart() {
        const ctx = document.getElementById('reactionChart');
        if (!ctx || !window.Chart) return;

        this.reactionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '平均反应 (ms)',
                        data: [],
                        borderColor: '#2f80ed',
                        backgroundColor: 'rgba(47, 128, 237, 0.14)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true
                    }
                ]
            },
            options: this.getChartOptions()
        });
    }

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(15, 23, 42, 0.08)'
                    },
                    ticks: {
                        color: '#52607a'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(15, 23, 42, 0.06)'
                    },
                    ticks: {
                        color: '#52607a'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#1e293b'
                    }
                }
            }
        };
    }

    updateStats() {
        this.stats = this.storage.getStats();
        this.ensureCharts();

        const averageAccuracy =
            this.stats.totalShots > 0 ? Math.round((this.stats.totalHits / this.stats.totalShots) * 100) : 0;
        const bestReaction = this.stats.bestReactionTime ? `${this.stats.bestReactionTime}ms` : '暂无';
        const unlockedCount = Object.values(this.storage.getAchievements()).filter(Boolean).length;

        this.setText('totalGames', this.stats.totalGames);
        this.setText('totalHits', this.stats.totalHits);
        this.setText('avgAccuracy', `${averageAccuracy}%`);
        this.setText('bestReaction', bestReaction);

        this.setText('dashboardTotalGames', this.stats.totalGames);
        this.setText('dashboardBestScore', this.stats.bestScore);
        this.setText('dashboardAccuracy', `${averageAccuracy}%`);
        this.setText('dashboardAchievements', unlockedCount);

        this.renderRecentSessions();
        this.renderModeBreakdown();
        this.updateCharts();
    }

    setText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    renderRecentSessions() {
        const container = document.getElementById('recentSessions');
        if (!container) return;

        const sessions = [...this.stats.games].slice(-6).reverse();

        if (sessions.length === 0) {
            container.innerHTML = '<p class="empty-state">还没有训练记录，去打一局把数据跑起来吧。</p>';
            return;
        }

        container.innerHTML = sessions
            .map((session) => {
                const date = new Date(session.date);
                return `
                    <article class="session-item">
                        <div>
                            <h4>${this.getModeLabel(session.mode)}</h4>
                            <p>${date.toLocaleString()}</p>
                        </div>
                        <div class="session-metrics">
                            <span>${session.score} 分</span>
                            <span>${session.accuracy}% 命中</span>
                            <span>${session.avgReactionTime || 0}ms</span>
                        </div>
                    </article>
                `;
            })
            .join('');
    }

    renderModeBreakdown() {
        const container = document.getElementById('modeBreakdown');
        if (!container) return;

        const grouped = {};
        this.stats.games.forEach((session) => {
            if (!grouped[session.mode]) {
                grouped[session.mode] = {
                    games: 0,
                    bestScore: 0,
                    accuracyTotal: 0
                };
            }

            grouped[session.mode].games += 1;
            grouped[session.mode].bestScore = Math.max(grouped[session.mode].bestScore, session.score);
            grouped[session.mode].accuracyTotal += session.accuracy;
        });

        const entries = Object.entries(grouped);
        if (entries.length === 0) {
            container.innerHTML = '<p class="empty-state">登录后你的训练偏好和模式表现会显示在这里。</p>';
            return;
        }

        container.innerHTML = entries
            .map(([mode, data]) => {
                const avgAccuracy = Math.round(data.accuracyTotal / data.games);
                return `
                    <article class="mode-breakdown-card">
                        <h4>${this.getModeLabel(mode)}</h4>
                        <p>局数 ${data.games}</p>
                        <p>最佳 ${data.bestScore}</p>
                        <p>平均命中 ${avgAccuracy}%</p>
                    </article>
                `;
            })
            .join('');
    }

    updateCharts() {
        const sessions = this.stats.games.slice(-10);
        const labels = sessions.map((session) => {
            const date = new Date(session.date);
            return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(
                date.getHours()
            ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        });

        if (this.accuracyChart) {
            this.accuracyChart.data.labels = labels;
            this.accuracyChart.data.datasets[0].data = sessions.map((session) => session.accuracy);
            this.accuracyChart.update();
        }

        if (this.reactionChart) {
            this.reactionChart.data.labels = labels;
            this.reactionChart.data.datasets[0].data = sessions.map((session) => session.avgReactionTime || 0);
            this.reactionChart.update();
        }
    }

    async recordSession(session) {
        const stats = this.storage.getStats();
        stats.totalGames += 1;
        stats.totalHits += session.hits;
        stats.totalShots += session.shots;
        stats.totalScore += session.score;
        stats.bestScore = Math.max(stats.bestScore, session.score);
        stats.bestAccuracy = Math.max(stats.bestAccuracy, session.accuracy);
        if (session.avgReactionTime > 0) {
            stats.bestReactionTime =
                stats.bestReactionTime === null
                    ? session.avgReactionTime
                    : Math.min(stats.bestReactionTime, session.avgReactionTime);
        }

        stats.games.push(session);
        stats.games = stats.games.slice(-100);
        this.storage.saveStats(stats);
        this.updateStats();

        if (window.auth && window.auth.isLoggedIn()) {
            try {
                await window.auth.syncGameData({ stats });
            } catch (error) {
                console.error('同步统计数据失败:', error.message);
            }
        }
    }

    getModeLabel(mode) {
        const labels = {
            flicking: '点击模式',
            tracking: '追踪模式',
            switching: '切换模式',
            reflex: '闪现模式',
            sixtarget: '六目标模式'
        };

        return labels[mode] || mode;
    }
}
