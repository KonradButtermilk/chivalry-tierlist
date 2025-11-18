document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('add-player-btn');
    const nameInput = document.getElementById('new-player-name');
    const trashZone = document.getElementById('trash-zone');

    // Initial Data
    let tierData = {
        1: ['Anka', 'Wondy', 'Macik', 'Fritz', 'Doomer', 'Teddo', 'DikAleks', 'Watermark', 'mkay', 'gilgamesh', 'astro'],
        2: ['Netto', 'Bonk', 'Wes', 'bb willetz', 'nkvd serafin', 'slavak, gadza, marsilion'],
        3: ['Chungus Cluegi', 'Ragnar', 'Leonardo', 'Godefroy', 'Fearzing', 'Alcor'],
        4: ['RobertDDI', 'Absdulah', 'bearded snake', 'BigF', 'proptt'],
        5: ['RapidSna1l', 'TowarzyszSkipper']
    };

    // Load from local storage if available
    const savedData = localStorage.getItem('chiv2_tier_list');
    if (savedData) {
        tierData = JSON.parse(savedData);
    }

    // Render initial list
    renderAllTiers();

    // Add Player Event
    addBtn.addEventListener('click', () => {
        addPlayer();
    });

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addPlayer();
        }
    });

    function addPlayer() {
        const name = nameInput.value.trim();
        if (name) {
            // Add to Tier 5 by default or Tier 1? Let's add to Tier 5 as "Unranked" initially or Tier 1 as requested?
            // User said "latwo mozna dodawac graczy do poszczeólnych kategorii".
            // For simplicity, let's add to Tier 1 (Best) as per "Tier 1 najlepszy" implication or maybe just default to 1.
            // Let's default to Tier 5 (lowest) so they can climb, or Tier 1 if they are adding a "best" player.
            // Let's just add to Tier 1 for now as it's the first one.

            // Actually, let's make it add to the first tier, user can move them.
            if (!tierData[1]) tierData[1] = [];
            tierData[1].push(name);
            saveData();
            renderTier(1);
            nameInput.value = '';
        }
    }

    function renderAllTiers() {
        for (let i = 1; i <= 5; i++) {
            renderTier(i);
        }
    }

    function renderTier(tierNum) {
        const listEl = document.getElementById(`tier-${tierNum}-list`);
        listEl.innerHTML = '';

        const players = tierData[tierNum] || [];
        players.forEach((player, index) => {
            const card = createPlayerCard(player, tierNum, index);
            listEl.appendChild(card);
        });
    }

    function createPlayerCard(name, tierNum, index) {
        const div = document.createElement('div');
        div.className = 'player-card';
        div.draggable = true;
        div.textContent = name;
        div.dataset.tier = tierNum;
        div.dataset.index = index;

        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragend', handleDragEnd);

        return div;
    }

    function saveData() {
        localStorage.setItem('chiv2_tier_list', JSON.stringify(tierData));
    }

    // Drag and Drop Logic
    let draggedItem = null;
    let sourceTier = null;
    let sourceIndex = null;

    function handleDragStart(e) {
        draggedItem = this;
        sourceTier = parseInt(this.dataset.tier);
        sourceIndex = parseInt(this.dataset.index);

        this.classList.add('dragging');
        trashZone.classList.add('visible');
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        trashZone.classList.remove('visible');
        trashZone.classList.remove('drag-over');

        draggedItem = null;
        sourceTier = null;
        sourceIndex = null;

        // Re-render to clean up any visual glitches
        renderAllTiers();
    }

    // Drop Zones (Columns)
    const columns = document.querySelectorAll('.tier-column');
    columns.forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
            e.dataTransfer.dropEffect = 'move';
        });

        col.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetTier = parseInt(col.dataset.tier);

            if (draggedItem && targetTier) {
                movePlayer(sourceTier, sourceIndex, targetTier);
            }
        });
    });

    // Trash Zone
    trashZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        trashZone.classList.add('drag-over');
    });

    trashZone.addEventListener('dragleave', () => {
        trashZone.classList.remove('drag-over');
    });

    trashZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedItem) {
            deletePlayer(sourceTier, sourceIndex);
        }
    });

    function movePlayer(fromTier, fromIndex, toTier) {
        if (fromTier === toTier) return; // Optimization: Handle reordering later if needed

        const player = tierData[fromTier][fromIndex];

        // Remove from old
        tierData[fromTier].splice(fromIndex, 1);

        // Add to new
        if (!tierData[toTier]) tierData[toTier] = [];
        tierData[toTier].push(player);

        saveData();
        renderAllTiers();
    }

    function deletePlayer(tier, index) {
        if (confirm(`Czy na pewno chcesz usunąć gracza "${tierData[tier][index]}"?`)) {
            tierData[tier].splice(index, 1);
            saveData();
            renderAllTiers();
        }
    }
});
