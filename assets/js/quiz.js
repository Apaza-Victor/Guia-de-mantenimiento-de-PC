/* ============================================================
   TECHGUIDE - quiz.js (cuestionarios interactivos)
   ============================================================ */

document.addEventListener('DOMContentLoaded', initQuizzes);

function initQuizzes() {
  document.querySelectorAll('.quiz-card').forEach(card => {
    const options = card.querySelectorAll('.quiz-opt');
    options.forEach(opt => {
      opt.addEventListener('click', () => {
        if (card.querySelector('.quiz-opt.selected')) return;
        selectAnswer(card, opt);
      });
    });
  });
}

function selectAnswer(card, opt) {
  const correct = opt.dataset.correct === 'true';
  opt.classList.add('selected', correct ? 'correct' : 'wrong');
  card.querySelectorAll('.quiz-opt').forEach(o => {
    if (o.dataset.correct === 'true') o.classList.add('correct');
  });
  const score = card.querySelector('.quiz-score');
  if (score) {
    if (correct) {
      score.textContent = 'Correcto!';
      score.style.color = 'var(--accent2)';
    } else {
      score.textContent = 'Incorrecto';
      score.style.color = 'var(--accent3)';
    }
  }
}
