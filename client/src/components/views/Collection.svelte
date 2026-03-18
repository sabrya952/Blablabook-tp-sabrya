<script>
  import { api } from "../../service/api.service.js";
  import CardBook from "../CardBook.svelte";

  // États réactifs
  let books = $state([]);
  let loading = $state(false);
  let error = $state(null);
  let activeFilter = $state("tous");
let toast = $state(null);
import { token } from "../../stores/auth.js";
let isLoggedIn = $state(false);
$effect(() => {
  token.subscribe(val => { isLoggedIn = val !== null; });
});

  const STATUSES = ["à lire", "en cours", "lu", "abandonné", "en pause"];

  // Effet pour vérification connexion et chargement
  $effect(() => {
    if (isLoggedIn) loadCollection();
  });


  async function loadCollection(status = null) {
    loading = true;
    error = null;
    try {
      const res = await api.getCollection(status === "tous" ? null : status);
      books = res.books || [];
    } catch (e) {
      error = "Erreur lors du chargement.";
    } finally {
      loading = false;
    }
  }

  async function updateStatus(bookId, newStatus) {
    try {
      await api.updateCollectionStatus(bookId, newStatus);
      books = books.map(b =>
        b.id === bookId ? { ...b, collectStatus: newStatus } : b
      );
      showToast("Statut mis à jour", "success");
    } catch (e) {
      showToast("Erreur lors de la mise à jour", "error");
    }
  }

  async function removeBook(bookId) {
    try {
      await api.removeFromCollection(bookId);
      books = books.filter(b => b.id !== bookId);
      showToast("Livre retiré", "success");
    } catch (e) {
      showToast("Erreur lors de la suppression", "error");
    }
  }

  function showToast(message, type) {
    toast = { message, type };
    setTimeout(() => { toast = null; }, 3000);
  }

  function setFilter(status) {
    activeFilter = status;
    loadCollection(status);
  }
</script>

<section class="collection">
  <h2>Ma collection</h2>

  {#if !isLoggedIn}
    <div class="not-logged">
      Connectez-vous pour voir votre collection
    </div>
  {:else}
    <!-- Filtres par statut -->
    <div class="filters">
      <button 
        class:active={activeFilter === "tous"}
        onclick={() => setFilter("tous")}
      >Tous</button>
      {#each STATUSES as status}
        <button 
          class:active={activeFilter === status}
          onclick={() => setFilter(status)}
        >{status}</button>
      {/each}
    </div>

    {#if loading}
      <div class="loading">Chargement...</div>
    {:else if error}
      <div class="error">{error}</div>
    {:else if books.length === 0}
      <p>Votre collection est vide.</p>
    {:else}
      <div class="grid">
        {#each books as book (book.id)}
          <div class="book-card">
            <CardBook {book} />
            <div class="card-actions">
              <select 
                value={book.collectStatus}
                onchange={(e) => updateStatus(book.id, e.target.value)}
              >
                {#each STATUSES as s}
                  <option value={s}>{s}</option>
                {/each}
              </select>
              <button onclick={() => removeBook(book.id)}>Retirer</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}

  {#if toast}
    <div class="toast {toast.type}">{toast.message}</div>
  {/if}
</section>

<style>
  .collection {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .filters {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 2rem;
  }

  .filters button {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    background: white;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filters button:hover {
    background: #f5f5f5;
  }

  .filters button.active {
    background: var(--color-secondary);
    color: white;
    border-color: var(--color-secondary);
  }

  .not-logged, .loading, .error {
    text-align: center;
    padding: 3rem;
    font-size: 1.2rem;
  }

  .error {
    color: #d32f2f;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }

  .book-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .card-actions select {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
  }

  .card-actions button {
    padding: 0.5rem 1rem;
    border: 1px solid #f44336;
    background: transparent;
    color: #f44336;
    border-radius: 6px;
    cursor: pointer;
  }

  .card-actions button:hover {
    background: #f44336;
    color: white;
  }

  .toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  }

  .toast.success { background: #4caf50; }
  .toast.error { background: #f44336; }

  @media (max-width: 768px) {
    .grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
    }
  }
</style>
