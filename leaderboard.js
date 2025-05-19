document.addEventListener('DOMContentLoaded', () => {
    const leaderboardList = document.getElementById('leaderboard-list');
    
    function updateLeaderboard() {
        fetch('https://flask-backend-9bjs.onrender.com/leaderboard')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch leaderboard data');
                }
                return response.json();
            })
            .then(data => {
                // Sort data by score in descending order
                data.sort((a, b) => b.score - a.score);
                
                leaderboardList.innerHTML = '';
                
                // Get current user's score
                const currentUser = localStorage.getItem('username') || 'Guest';
                let userRank = -1;
                
                data.forEach((entry, index) => {
                    const li = document.createElement('li');
                    // Add special styling for current user
                    if (entry.name === currentUser) {
                        li.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                        li.style.border = '2px solid #fff';
                        userRank = index + 1;
                    }
                    
                    // Format the score with proper spacing
                    const scoreText = entry.score.toString().padStart(2, ' ');
                    li.textContent = `${(index + 1).toString().padStart(2, ' ')}. ${entry.name.padEnd(20, ' ')} ${scoreText}`;
                    leaderboardList.appendChild(li);
                });
                
                // If user not in top 10, show their rank at the bottom
                if (userRank > 10) {
                    const userEntry = data.find(entry => entry.name === currentUser);
                    if (userEntry) {
                        const li = document.createElement('li');
                        li.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                        li.style.border = '2px solid #fff';
                        li.style.marginTop = '20px';
                        li.textContent = `...`;
                        leaderboardList.appendChild(li);
                        
                        const userLi = document.createElement('li');
                        userLi.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                        userLi.style.border = '2px solid #fff';
                        const scoreText = userEntry.score.toString().padStart(2, ' ');
                        userLi.textContent = `${userRank.toString().padStart(2, ' ')}. ${currentUser.padEnd(20, ' ')} ${scoreText}`;
                        leaderboardList.appendChild(userLi);
                    }
                }
            })
            .catch(error => {
                console.error('Error loading leaderboard:', error);
                leaderboardList.innerHTML = '<li>Error loading leaderboard. Please try again later.</li>';
            });
    }

    // Initial load
    updateLeaderboard();
    
    // Refresh every 5 seconds
    setInterval(updateLeaderboard, 5000);
});