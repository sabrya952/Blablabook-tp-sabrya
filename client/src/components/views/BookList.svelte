<script>
  import { onMount } from "svelte";
  import { api } from "../../service/api.service.js";
  import CardBook from "../CardBook.svelte";

  // États réactifs avec $state
  let books = $state([]);
  let page = $state(1);
  let totalPages = $state(1);
  let order = $state("A-Z");
  let loading = $state(false);
  let error = $state(null);
  const limit = 12;

  // Fonction de chargement des livres
  async function loadBooks() {
    loading = true;
    error = null;
    try {
      const res = await api.allBook({ page, limit, order });
      books = res.books || [];
      totalPages = res.totalPages ?? 1;
    } catch (e) {
      error = "Erreur lors du chargement des livres.";
    } finally {
      loading = false;
    }
  }

  // Effet réactif : recharger quand page ou order change
  $effect(() => {
    loadBooks();
  });

  // Changement de page
  function changePage(delta) {
    page += delta;
  }

  // Changement d'ordre
  function changeOrder(newOrder) {
    order = newOrder;
    page = 1; // Reset page
  }

</script>

<section>
  <h2>Catalogue</h2>
  <!-- Section tri -->
  <div class="controls">
    <label>
      Trier par titre :
      <select bind:value={order}>
        <option value="A-Z">A → Z</option>
        <option value="Z-A">Z → A</option>
      </select>
    </label>
  </div>

  <!-- Section chargement -->
  {#if loading}
    <div class="loading">Chargement...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if books.length === 0}
    <div class="empty">Aucun livre trouvé.</div>
  {:else}
    <!-- Grille des livres -->
    <div class="grid">
      {#each books as book}
        <CardBook {book} />
      {/each}
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button 
        onclick={() => changePage(-1)}
        disabled={page === 1}
      >
        Précédent
      </button>
      <span>Page {page} / {totalPages}</span>
      <button 
        onclick={() => changePage(1)}
        disabled={page === totalPages}
      >
        Suivant
      </button>
    </div>
  {/if}
</section>

<style>
  section {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  /* Contrôles de tri */
  .controls {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 2rem;
  }

  .controls label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }

  .controls select {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: white;
  }

  /* États spéciaux */
  .loading, .error, .empty {
    text-align: center;
    padding: 3rem;
    font-size: 1.1rem;
  }

  .error {
    color: #d32f2f;
  }

  /* Grille responsive */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 2rem;
  }

  /* Pagination */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  .pagination button {
    padding: 0.75rem 1.5rem;
    border: 1px solid #ddd;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pagination button:hover:not(:disabled) {
    background: #f5f5f5;
  }

  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
    }

    .pagination {
      gap: 0.5rem;
    }

    .pagination button {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }
  }
</style>
