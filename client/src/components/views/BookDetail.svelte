<script>
  import { api } from "../../service/api.service.js";

  // Props Svelte 5
  let { params } = $props();

  // États réactifs
  let book = $state(null);
  let loading = $state(true);
  let error = $state(null);
  let toast = $state(null);
import { token } from "../../stores/auth.js";
let isLoggedIn = $state(false);
$effect(() => {
  token.subscribe(val => { isLoggedIn = val !== null; });
});
  let alreadyInCollection = $state(false);




  // Effet de chargement du livre
  $effect(() => {
    if (params.id) {
      loadBook();
    }
  });

  // Vérifier connexion utilisateur


  // Chargement du livre
  async function loadBook() {
    loading = true;
    error = null;
    try {
      book = await api.getBook(params.id);
    } catch (e) {
      error = "Livre non trouvé.";
    } finally {
      loading = false;
    }
  }

  // Ajout à la collection
  async function addToCollection() {
    try {
      await api.addToCollection(book.id);
      alreadyInCollection = true;
      showToast("Livre ajouté à votre collection !", "success");
    } catch (err) {
      if (err.message.includes("409") || err.message.includes("Conflict")) {
        alreadyInCollection = true;
        showToast("Déjà dans votre collection.", "info");
      } else {
        showToast("Erreur lors de l'ajout.", "error");
      }
    }
  }

  // Toast
  function showToast(message, type) {
    toast = { message, type };
    setTimeout(() => {
      toast = null;
    }, 3000);
  }

  // Retour
  function goBack() {
    window.history.back();
  }
</script>

<section class="book-detail">
  <!-- Bouton retour -->
  <button class="back-btn" onclick={goBack}>← Retour</button>

  <!-- Contenu principal -->
  {#if loading}
    <div class="loading">Chargement...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if book}
    <div class="content">
      <!-- Image avec skeleton -->
      <div class="image-section">
        {#if !book.cover}
          <div class="skeleton-image"></div>
        {:else}
          <img src={book.cover} alt={book.title} />
        {/if}
      </div>

      <!-- Détails -->
      <div class="details">
        <h1>{book.title}</h1>
        <p class="author">par {book.author}</p>
        <p class="year">{book.publish_year}</p>
        {#if book.description}
          <div class="description">{book.description}</div>
        {/if}

        {#if isLoggedIn}
          <button 
            class="collection-btn"
            class:disabled={alreadyInCollection}
            onclick={addToCollection}
          >
            {alreadyInCollection ? "Dans votre collection ✓" : "Ajouter à ma collection"}
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Toast -->
  {#if toast}
    <div class="toast {toast.type}">
      {toast.message}
    </div>
  {/if}
</section>

<style>
  .book-detail {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .back-btn {
    background: none;
    border: 1px solid #ddd;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 2rem;
  }

  .content {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 3rem;
    align-items: start;
  }

  .image-section {
    width: 300px;
  }

  .image-section img {
    width: 100%;
    aspect-ratio: 2 / 3;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .skeleton-image {
    width: 100%;
    aspect-ratio: 2 / 3;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 12px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .details h1 {
    font-size: 2.5rem;
    margin: 0 0 1rem;
    line-height: 1.2;
  }

  .author {
    font-size: 1.3rem;
    color: #666;
    margin: 0 0 0.5rem;
    font-weight: 500;
  }

  .year {
    color: #888;
    margin: 0 0 2rem;
    font-size: 1.1rem;
  }

  .description {
    line-height: 1.6;
    margin: 2rem 0;
  }

  .collection-btn {
    padding: 1rem 2rem;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .collection-btn:hover:not(:disabled) {
    background: #45a049;
  }

  .collection-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .loading, .error {
    text-align: center;
    padding: 4rem 2rem;
    font-size: 1.2rem;
  }

  .error {
    color: #d32f2f;
  }

  .toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    max-width: 350px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .toast.success {
    background: #4caf50;
  }

  .toast.error {
    background: #f44336;
  }

  .toast.info {
    background: #2196f3;
  }

  /* Mobile */
  @media (max-width: 600px) {
    .content {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .image-section {
      width: 100%;
      max-width: 300px;
      margin: 0 auto;
    }

    .details h1 {
      font-size: 2rem;
    }

    .toast {
      bottom: 1rem;
      right: 1rem;
      left: 1rem;
      max-width: none;
    }
  }
</style>
