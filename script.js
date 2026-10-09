const jokeQuestion = document.getElementById('jokeQuestion');
const jokeAnswer = document.getElementById('jokeAnswer');
const pageCategory = document.getElementById('pageCategory');
const pageNumber = document.getElementById('pageNumber');
const pagePicker = document.getElementById('pagePicker');
const previousButton = document.getElementById('previousButton');
const nextButton = document.getElementById('nextButton');
const apiStatus = document.getElementById('apiStatus');
const retryButton = document.getElementById('retryButton');
const book = document.querySelector('.book');
let jokes = [];
let currentPage = 0;

const categoryLabels = {
  Programming: 'programación',
  Miscellaneous: 'variado',
  Dark: 'humor negro',
  Pun: 'juegos de palabras',
  Spooky: 'misterio',
  Christmas: 'navideño'
};

function setLoading(isLoading) {
  book.setAttribute('aria-busy', String(isLoading));
  previousButton.disabled = isLoading;
  nextButton.disabled = isLoading;
  retryButton.hidden = isLoading;
  apiStatus.textContent = isLoading ? 'Conectando con JokeAPI...' : '';
}

function normalizeJoke(apiJoke) {
  if (typeof apiJoke.category !== 'string') {
    throw new Error('La API devolvió un chiste sin categoría.');
  }

  const question = apiJoke.type === 'single' ? apiJoke.joke : apiJoke.setup;
  const answer = apiJoke.type === 'single' ? '' : apiJoke.delivery;
  if (typeof question !== 'string' || typeof answer !== 'string') {
    throw new Error('La API devolvió un chiste con un formato inesperado.');
  }

  return {
    category: `Humor de ${categoryLabels[apiJoke.category] || apiJoke.category}`,
    question,
    answer
  };
}

async function loadJokes() {
  setLoading(true);
  pagePicker.replaceChildren();

  try {
    const params = new URLSearchParams({
      lang: 'es',
      amount: '10',
      blacklistFlags: 'nsfw,religious,political,racist,sexist,explicit'
    });
    const response = await fetch(`https://v2.jokeapi.dev/joke/Any?${params}`);
    if (!response.ok) {
      throw new Error(`La API respondió con el estado ${response.status}.`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.message || 'JokeAPI no pudo proporcionar chistes.');
    }
    if (!Array.isArray(data.jokes) || data.jokes.length === 0) {
      throw new Error('La API no devolvió chistes en español.');
    }

    jokes = data.jokes.map(normalizeJoke);
    currentPage = 0;
    jokes.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'page-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', `Ir a la página ${index + 1}`);
      dot.addEventListener('click', () => goToPage(index));
      pagePicker.append(dot);
    });

    renderPage();
    apiStatus.textContent = '';
  } catch (error) {
    console.error('No se pudieron cargar los chistes desde JokeAPI:', error);
    jokeQuestion.textContent = 'No se pudieron cargar los chistes.';
    jokeAnswer.textContent = 'Comprueba tu conexión e inténtalo de nuevo.';
    pageCategory.textContent = 'Error de conexión';
    pageNumber.textContent = '— / —';
    previousButton.disabled = true;
    nextButton.disabled = true;
    retryButton.hidden = false;
    apiStatus.textContent = 'No fue posible conectar con JokeAPI.';
  } finally {
    book.setAttribute('aria-busy', 'false');
  }
}

function renderPage() {
  const joke = jokes[currentPage];

  jokeQuestion.textContent = joke.question;
  jokeAnswer.textContent = joke.answer;
  pageCategory.textContent = joke.category;
  pageNumber.textContent = `${String(currentPage + 1).padStart(2, '0')} / ${String(jokes.length).padStart(2, '0')}`;
  previousButton.disabled = currentPage === 0;
  nextButton.disabled = currentPage === jokes.length - 1;

  pagePicker.querySelectorAll('.page-dot').forEach((dot, index) => {
    if (index === currentPage) {
      dot.setAttribute('aria-current', 'page');
    } else {
      dot.removeAttribute('aria-current');
    }
  });
}

function goToPage(pageIndex) {
  if (pageIndex < 0 || pageIndex >= jokes.length || pageIndex === currentPage) {
    return;
  }

  currentPage = pageIndex;
  renderPage();
}

previousButton.addEventListener('click', () => goToPage(currentPage - 1));
nextButton.addEventListener('click', () => goToPage(currentPage + 1));
retryButton.addEventListener('click', loadJokes);

document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  if (event.key === 'ArrowLeft') {
    goToPage(currentPage - 1);
  } else if (event.key === 'ArrowRight') {
    goToPage(currentPage + 1);
  }
});

loadJokes();
