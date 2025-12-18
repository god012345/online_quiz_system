fetch("/api/quiz/leaderboard")
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById("list");
    list.innerHTML = "";

    data.forEach((u, i) => {
      list.innerHTML += `
        <p>${i + 1}. <b>${u.name}</b> — ${u.score}</p>
      `;
    });
  });
