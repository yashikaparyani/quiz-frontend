document.addEventListener('DOMContentLoaded', () => {
    const leaderboardList = document.getElementById('leaderboard-list');

    fetch('https://flask-backend-9bjs.onrender.com/leaderboard')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard data');
            }
            return response.json();
        })
        .then(data => {
            leaderboardList.innerHTML = '';

            data.forEach((entry, index) => {
                const li = document.createElement('li');
                // Use rank from backend if available, otherwise use index + 1
                const rank = entry.rank || index + 1;
                li.textContent = `${rank}. ${entry.name} - ${entry.score}`;
                leaderboardList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error loading leaderboard:', error);
            leaderboardList.innerHTML = '<li>Error loading leaderboard. Please try again later.</li>';
        });
});