document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const modeSelectionSection = document.getElementById('modeSelection');
    const appContentDiv = document.getElementById('appContent');
    const btnLoadSample = document.getElementById('btnLoadSample');
    const btnStartUser = document.getElementById('btnStartUser');
    const sampleScenarioSelectorDiv = document.getElementById('sampleScenarioSelector');
    const sampleScenariosSelect = document.getElementById('sampleScenarios');
    const btnConfirmSample = document.getElementById('btnConfirmSample');

    const personasContainer = document.getElementById('personasContainer');
    const btnAddPersona = document.getElementById('btnAddPersona');
    // Optional: Placeholder for validation message
    // const personaPercentageValidationEl = document.getElementById('personaPercentageValidation');

    const tiersContainer = document.getElementById('tiersContainer');
    const btnAddTier = document.getElementById('btnAddTier');

    const statesContainer = document.getElementById('statesContainer');
    const btnAddState = document.getElementById('btnAddState');
    const baselineTransitionsTableContainer = document.getElementById('baselineTransitionsTableContainer');
    const tierInfluencesContainer = document.getElementById('tierInfluencesContainer');

    const initialDonorsInput = document.getElementById('initialDonorsInput');
    const discountFactorInput = document.getElementById('discountFactor');
    const simulationPeriodsInput = document.getElementById('simulationPeriods');
    const btnRunSimulation = document.getElementById('btnRunSimulation');

    const resultsArea = document.getElementById('resultsArea');
    const totalNPVEl = document.getElementById('totalNPV');
    const periodContributionsEl = document.getElementById('periodContributions');
    const donorCountsChartEl = document.getElementById('donorCountsChart');
    const donorCountsLegendEl = document.getElementById('donorCountsLegend');
    const policyTableContainer = document.getElementById('policyTableContainer');

    const btnSaveData = document.getElementById('btnSaveData');
    const btnClearData = document.getElementById('btnClearData');

    // --- Global State ---
    let appData = {
        personas: [],
        tiers: [],
        lifecycleStates: [],
        baselineTransitions: {}, // { fromState: { toState: probability } }
        tierInfluences: {} // { tierId: { fromState: { toState: multiplier } } }
    };

    // --- Sample Data ---
    const sampleScenariosData = {
        artsGroup: {
            personas: [
                { id: Date.now(), name: 'Casual Supporter', alpha: 0.4, beta: 0.3, gamma: 0.1, percentage: 0.5 },
                { id: Date.now()+1, name: 'Community Insider', alpha: 0.5, beta: 0.6, gamma: 0.4, percentage: 0.3 },
                { id: Date.now()+2, name: 'Arts Patron', alpha: 0.7, beta: 0.5, gamma: 0.7, percentage: 0.2 }
            ],
            tiers: [
                { id: Date.now()+3, name: 'Friend', pk: 50, bk_score: 2, sk_score: 1, cost: 5, availableInStates: ['Visitor', 'Member'] },
                { id: Date.now()+4, name: 'Supporter', pk: 150, bk_score: 5, sk_score: 4, cost: 20, availableInStates: ['Visitor', 'Member', 'Sustainer'] },
                { id: Date.now()+5, name: 'Patron Circle', pk: 500, bk_score: 8, sk_score: 8, cost: 75, availableInStates: ['Member', 'Sustainer'] }
            ],
            lifecycleStates: [
                { id: Date.now()+6, name: 'Visitor' },
                { id: Date.now()+7, name: 'Member' },
                { id: Date.now()+8, name: 'Sustainer' } // Simplified for this sample
            ],
            baselineTransitions: {
                'Visitor': { 'Visitor': 0.7, 'Member': 0.3, 'Sustainer': 0.0 },
                'Member': { 'Visitor': 0.1, 'Member': 0.7, 'Sustainer': 0.2 },
                'Sustainer': { 'Visitor': 0.05, 'Member': 0.15, 'Sustainer': 0.8 }
            },
            tierInfluences: {
               [(Date.now()+3).toString()]: { // Tier IDs need to be strings as keys in JSON/JS objects
                   'Member': { 'Visitor': 0.9, 'Member': 1.1, 'Sustainer': 1.0 }
               },
               [(Date.now()+4).toString()]: {
                   'Member': { 'Visitor': 1.0, 'Member': 0.9, 'Sustainer': 1.3 }
               }
             },
            initialDonors: {"Visitor": 500, "Member": 100, "Sustainer": 20},
            discountFactor: 0.9,
            simulationPeriods: 5
        },
         ecoNgo: { // Added second sample scenario
            personas: [
                { id: Date.now()+10, name: 'Activist', alpha: 0.8, beta: 0.1, gamma: 0.2, percentage: 0.4 },
                { id: Date.now()+11, name: 'Concerned Citizen', alpha: 0.5, beta: 0.3, gamma: 0.1, percentage: 0.5 },
                { id: Date.now()+12, name: 'Status Seeker', alpha: 0.3, beta: 0.4, gamma: 0.8, percentage: 0.1 }
            ],
            tiers: [
                { id: Date.now()+13, name: 'Eco-Watcher', pk: 25, bk_score: 1, sk_score: 0, cost: 3, availableInStates: ['Visitor', 'Subscriber'] },
                { id: Date.now()+14, name: 'Eco-Advocate', pk: 100, bk_score: 3, sk_score: 3, cost: 15, availableInStates: ['Subscriber', 'Advocate', 'Champion'] },
                { id: Date.now()+15, name: 'Eco-Champion', pk: 1000, bk_score: 7, sk_score: 9, cost: 100, availableInStates: ['Advocate', 'Champion'] }
            ],
            lifecycleStates: [
                { id: Date.now()+16, name: 'Visitor' },
                { id: Date.now()+17, name: 'Subscriber' }, // e.g., newsletter
                { id: Date.now()+18, name: 'Advocate' },   // Regular donor
                { id: Date.now()+19, name: 'Champion' }    // Major/Leadership donor
            ],
            baselineTransitions: {
                'Visitor': {'Visitor': 0.8, 'Subscriber': 0.2, 'Advocate': 0.0, 'Champion': 0.0},
                'Subscriber': {'Visitor': 0.1, 'Subscriber': 0.7, 'Advocate': 0.2, 'Champion': 0.0},
                'Advocate': {'Visitor': 0.05, 'Subscriber': 0.1, 'Advocate': 0.8, 'Champion': 0.05},
                'Champion': {'Visitor': 0.02, 'Subscriber': 0.03, 'Advocate': 0.15, 'Champion': 0.8}
            },
            tierInfluences: {
                [(Date.now()+14).toString()]: {
                    'Subscriber': { 'Visitor': 1.0, 'Subscriber': 0.9, 'Advocate': 1.2, 'Champion': 1.0 }
                },
                 [(Date.now()+15).toString()]: {
                     'Advocate': { 'Visitor': 1.0, 'Subscriber': 1.0, 'Advocate': 0.8, 'Champion': 1.5 }
                 }
            },
            initialDonors: {"Visitor": 10000, "Subscriber": 2000, "Advocate": 300, "Champion": 30},
            discountFactor: 0.92,
            simulationPeriods: 10
        }
    };

    // --- Default Values for User Mode ---
    const defaultAppData = {
        personas: [
            { id: Date.now()+100, name: 'Generic Altruist', alpha: 0.7, beta: 0.2, gamma: 0.1, percentage: 0.5 },
            { id: Date.now()+101, name: 'Benefit Seeker', alpha: 0.3, beta: 0.6, gamma: 0.3, percentage: 0.5 }
        ],
        tiers: [
            { id: Date.now()+102, name: 'Basic Tier', pk: 25, bk_score: 1, sk_score: 1, cost: 2, availableInStates: ['Visitor', 'Member'] }
        ],
        lifecycleStates: [
            { id: Date.now()+103, name: 'Visitor' },
            { id: Date.now()+104, name: 'Member' },
            { id: Date.now()+105, name: 'Sustainer' },
            { id: Date.now()+106, name: 'Major Donor' }
        ],
        baselineTransitions: {
            'Visitor': {'Visitor': 0.8, 'Member': 0.2, 'Sustainer': 0.0, 'Major Donor': 0.0},
            'Member': {'Visitor': 0.1, 'Member': 0.7, 'Sustainer': 0.2, 'Major Donor': 0.0},
            'Sustainer': {'Visitor': 0.05, 'Member': 0.1, 'Sustainer': 0.8, 'Major Donor': 0.05},
            'Major Donor': {'Visitor': 0.05, 'Member': 0.05, 'Sustainer': 0.1, 'Major Donor': 0.8}
        },
        tierInfluences: {},
        initialDonors: {"Visitor": 1000, "Member": 200, "Sustainer": 50, "Major Donor": 10},
        discountFactor: 0.95,
        simulationPeriods: 5
    };

    // --- Initialization and Mode Selection ---
    btnLoadSample.addEventListener('click', () => {
        sampleScenarioSelectorDiv.style.display = 'block';
    });

    btnConfirmSample.addEventListener('click', () => {
        const selectedScenarioKey = sampleScenariosSelect.value;
        if (sampleScenariosData[selectedScenarioKey]) {
            loadDataIntoApp(sampleScenariosData[selectedScenarioKey]);
            modeSelectionSection.style.display = 'none';
            appContentDiv.style.display = 'block';
            btnSaveData.style.display = 'inline-block';
            btnClearData.style.display = 'inline-block';
            resultsArea.style.display = 'none';
        }
    });

    btnStartUser.addEventListener('click', () => {
        const savedData = localStorage.getItem('impactTierUserData');
        if (savedData) {
            try {
                loadDataIntoApp(JSON.parse(savedData));
            } catch (e) {
                console.error("Error parsing saved data, loading defaults.", e);
                loadDataIntoApp(JSON.parse(JSON.stringify(defaultAppData)));
            }
        } else {
            loadDataIntoApp(JSON.parse(JSON.stringify(defaultAppData)));
        }
        modeSelectionSection.style.display = 'none';
        appContentDiv.style.display = 'block';
        btnSaveData.style.display = 'inline-block';
        btnClearData.style.display = 'inline-block';
        resultsArea.style.display = 'none';
    });

    function loadDataIntoApp(dataToLoad) {
        // Deep clone to prevent modifying original sample/default objects
        appData = JSON.parse(JSON.stringify(dataToLoad));

        // --- Data Integrity Checks & Defaults ---
        appData.personas = appData.personas || [];
        appData.tiers = appData.tiers || [];
        appData.lifecycleStates = appData.lifecycleStates || [];
        appData.baselineTransitions = appData.baselineTransitions || {};
        appData.tierInfluences = appData.tierInfluences || {};
        appData.initialDonors = appData.initialDonors || defaultAppData.initialDonors;
        appData.discountFactor = appData.discountFactor !== undefined ? appData.discountFactor : defaultAppData.discountFactor;
        appData.simulationPeriods = appData.simulationPeriods || defaultAppData.simulationPeriods;

        // Ensure IDs are unique if loading potentially conflicting data
        ensureUniqueIds();

        // Ensure transition objects are fully populated for current states
        populateMissingTransitions();

        // --- Update Form Inputs ---
        initialDonorsInput.value = JSON.stringify(appData.initialDonors);
        discountFactorInput.value = appData.discountFactor;
        simulationPeriodsInput.value = appData.simulationPeriods;

        renderAll();
    }

     // Helper to ensure loaded data or additions don't have duplicate IDs
    function ensureUniqueIds() {
        const seenIds = new Set();
        let maxId = 0;

        const checkAndReplace = (item) => {
            maxId = Math.max(maxId, item.id || 0);
            if (!item.id || seenIds.has(item.id)) {
                console.warn('Duplicate or missing ID found, assigning new one:', item);
                item.id = Date.now() + Math.random(); // Simple way to get a likely unique ID
            }
            seenIds.add(item.id);
        };

        appData.personas.forEach(checkAndReplace);
        appData.tiers.forEach(checkAndReplace);
        appData.lifecycleStates.forEach(checkAndReplace);
    }

    // Helper to ensure transition structures cover all current states
    function populateMissingTransitions() {
        const stateNames = appData.lifecycleStates.map(s => s.name);

        // Baseline Transitions
        stateNames.forEach(fromName => {
            if (!appData.baselineTransitions[fromName]) {
                appData.baselineTransitions[fromName] = {};
            }
            stateNames.forEach(toName => {
                if (appData.baselineTransitions[fromName][toName] === undefined) {
                    appData.baselineTransitions[fromName][toName] = (fromName === toName ? 1.0 : 0.0);
                }
            });
             // Remove transitions to states that no longer exist
             Object.keys(appData.baselineTransitions[fromName]).forEach(toName => {
                 if (!stateNames.includes(toName)) {
                     delete appData.baselineTransitions[fromName][toName];
                 }
             });
            normalizeTransitionRow(appData.baselineTransitions[fromName]);
        });
         // Remove entries for states that no longer exist
         Object.keys(appData.baselineTransitions).forEach(fromName => {
             if (!stateNames.includes(fromName)) {
                 delete appData.baselineTransitions[fromName];
             }
         });


        // Tier Influences
         appData.tiers.forEach(tier => {
             const tierIdStr = tier.id.toString(); // Ensure string key
             if (!appData.tierInfluences[tierIdStr]) {
                 appData.tierInfluences[tierIdStr] = {};
             }
             stateNames.forEach(fromName => {
                 if (!appData.tierInfluences[tierIdStr][fromName]) {
                     appData.tierInfluences[tierIdStr][fromName] = {};
                 }
                 stateNames.forEach(toName => {
                     if (appData.tierInfluences[tierIdStr][fromName][toName] === undefined) {
                         appData.tierInfluences[tierIdStr][fromName][toName] = 1.0; // Default multiplier
                     }
                 });
                  // Remove influences to states that no longer exist
                  Object.keys(appData.tierInfluences[tierIdStr][fromName]).forEach(toName => {
                      if (!stateNames.includes(toName)) {
                          delete appData.tierInfluences[tierIdStr][fromName][toName];
                      }
                  });
             });
              // Remove influence entries for states that no longer exist
              Object.keys(appData.tierInfluences[tierIdStr]).forEach(fromName => {
                 if (!stateNames.includes(fromName)) {
                     delete appData.tierInfluences[tierIdStr][fromName];
                 }
             });
         });
           // Remove influence entries for tiers that no longer exist
           const tierIds = new Set(appData.tiers.map(t => t.id.toString()));
           Object.keys(appData.tierInfluences).forEach(tierIdStr => {
               if (!tierIds.has(tierIdStr)) {
                   delete appData.tierInfluences[tierIdStr];
               }
           });
    }


    function renderAll() {
        renderPersonas();
        renderLifecycleStates(); // This chain reaction updates states, transitions, influences, tiers
    }


    // --- Persona Management ---
    function renderPersonas() {
        personasContainer.innerHTML = '';
        appData.personas.forEach((persona, index) => {
            const div = document.createElement('div');
            div.classList.add('persona-item');
            div.innerHTML = `
                <h4><input type="text" class="persona-name" value="${persona.name}" data-id="${persona.id}" placeholder="Archetype Name"></h4>
                <label>Mission (α): <input type="number" class="persona-alpha" value="${persona.alpha}" step="0.01" min="0" max="1" data-id="${persona.id}"></label>
                <label>Perks (β): <input type="number" class="persona-beta" value="${persona.beta}" step="0.01" min="0" max="1" data-id="${persona.id}"></label>
                <label>Recognition (γ): <input type="number" class="persona-gamma" value="${persona.gamma}" step="0.01" min="0" max="1" data-id="${persona.id}"></label>
                <label>% of Base: <input type="number" class="persona-percentage" value="${persona.percentage}" step="0.01" min="0" max="1" data-id="${persona.id}"></label>
                <button class="btn-remove-persona" data-id="${persona.id}">Remove</button>
            `;
            personasContainer.appendChild(div);
        });
        addPersonaEventListeners();
        validatePersonaPercentages();
    }

    function addPersonaEventListeners() {
        personasContainer.addEventListener('change', (e) => {
            if (e.target.matches('.persona-name, .persona-alpha, .persona-beta, .persona-gamma, .persona-percentage')) {
                const id = parseInt(e.target.dataset.id);
                const persona = appData.personas.find(p => p.id === id);
                if (persona) {
                    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                    const key = e.target.className.split('-')[1];
                    // Basic validation for numeric inputs
                     if (e.target.type === 'number') {
                         if (isNaN(value)) {
                              e.target.value = persona[key]; // Revert if NaN
                              return;
                         }
                         const min = parseFloat(e.target.min);
                         const max = parseFloat(e.target.max);
                         if (!isNaN(min) && value < min) { e.target.value = min; persona[key] = min; }
                         else if (!isNaN(max) && value > max) { e.target.value = max; persona[key] = max; }
                         else { persona[key] = value; }
                     } else {
                          persona[key] = value.trim(); // Trim whitespace from name
                          e.target.value = persona[key]; // Update input field in case it was trimmed
                     }

                    if (e.target.classList.contains('persona-percentage')) {
                        validatePersonaPercentages();
                    }
                }
            }
        });
        personasContainer.addEventListener('click', (e) => {
             if (e.target.classList.contains('btn-remove-persona')) {
                 const id = parseInt(e.target.dataset.id);
                 appData.personas = appData.personas.filter(p => p.id !== id);
                 renderPersonas();
             }
        });
    }

    function validatePersonaPercentages() {
        let total = appData.personas.reduce((sum, p) => sum + (p.percentage || 0), 0);
        const percentageInputs = personasContainer.querySelectorAll('.persona-percentage');
        // Use a tolerance for floating point comparison
        const isValid = Math.abs(total - 1.0) < 0.001 || appData.personas.length === 0;

        percentageInputs.forEach(input => {
             input.classList.toggle('invalid-input', !isValid); // Add/remove class based on validity
             input.title = isValid ? '' : `Sum of percentages is ${total.toFixed(3)}, should be 1.0`;
        });

        // Optional: Display overall message
        // if (personaPercentageValidationEl) {
        //     personaPercentageValidationEl.textContent = isValid ? '' : `⚠️ Percentages must sum to 1.0 (Current sum: ${total.toFixed(3)})`;
        // }
    }

    btnAddPersona.addEventListener('click', () => {
        appData.personas.push({ id: Date.now(), name: 'New Archetype', alpha: 0.5, beta: 0.5, gamma: 0.5, percentage: 0.0 });
        renderPersonas();
    });

    // --- Tier Management ---
    function renderTiers() {
        tiersContainer.innerHTML = '';
        appData.tiers.forEach((tier, index) => {
            const div = document.createElement('div');
            div.classList.add('tier-item');
            let statesCheckboxes = appData.lifecycleStates.map(s =>
                `<label style="display: inline-block; margin-right: 10px; font-weight: normal;"><input type="checkbox" class="tier-state" value="${s.name}" data-tier-id="${tier.id}" ${tier.availableInStates && tier.availableInStates.includes(s.name) ? 'checked' : ''}> ${s.name}</label>`
            ).join(' ');

            div.innerHTML = `
                <h4><input type="text" class="tier-name" value="${tier.name}" data-id="${tier.id}" placeholder="Tier Name"></h4>
                <label>Price (P<sub>k</sub>): <input type="number" class="tier-pk" value="${tier.pk}" min="0" step="any" data-id="${tier.id}"></label>
                <label>Benefit Score (B<sub>k</sub>): <input type="number" class="tier-bk" value="${tier.bk_score}" min="0" step="any" data-id="${tier.id}"></label>
                <label>Recognition Score (S<sub>k</sub>): <input type="number" class="tier-sk" value="${tier.sk_score}" min="0" step="any" data-id="${tier.id}"></label>
                <label>Cost to Org (c<sub>k</sub>): <input type="number" class="tier-cost" value="${tier.cost}" min="0" step="any" data-id="${tier.id}"></label>
                <div style="margin-top: 10px;"><strong style="color: var(--medium-text);">Available in States:</strong><br/> ${statesCheckboxes || 'No states defined'}</div>
                <button class="btn-remove-tier" data-id="${tier.id}">Remove</button>
            `;
            tiersContainer.appendChild(div);
        });
        addTierEventListeners();
        renderTierInfluences(); // Re-render influences if tiers change
    }

     function addTierEventListeners() {
        tiersContainer.addEventListener('change', (e) => {
             const target = e.target;
             if (target.matches('.tier-name, .tier-pk, .tier-bk, .tier-sk, .tier-cost')) {
                 const id = parseInt(target.dataset.id);
                 const tier = appData.tiers.find(t => t.id === id);
                 if (tier) {
                     const keyMap = { 'tier-pk': 'pk', 'tier-bk': 'bk_score', 'tier-sk': 'sk_score', 'tier-cost': 'cost', 'tier-name': 'name' };
                     const key = keyMap[target.className];
                     if(key){
                         if(target.type === 'number'){
                             let value = parseFloat(target.value);
                             if (isNaN(value)) { value = tier[key] || 0; target.value = value; } // Revert if NaN
                             const min = parseFloat(target.min);
                             if (!isNaN(min) && value < min) { value = min; target.value = value; }
                             tier[key] = value;
                         } else {
                              tier[key] = target.value.trim();
                              target.value = tier[key]; // Update field if trimmed
                         }
                     }
                 }
             } else if (target.matches('.tier-state')) {
                 const tierId = parseInt(target.dataset.tierId);
                 const stateName = target.value;
                 const tier = appData.tiers.find(t => t.id === tierId);
                 if (tier) {
                     if (!tier.availableInStates) tier.availableInStates = [];
                     if (target.checked) {
                         if (!tier.availableInStates.includes(stateName)) {
                             tier.availableInStates.push(stateName);
                         }
                     } else {
                         tier.availableInStates = tier.availableInStates.filter(s => s !== stateName);
                     }
                 }
             }
        });
         tiersContainer.addEventListener('click', (e) => {
             if (e.target.classList.contains('btn-remove-tier')) {
                 const id = parseInt(e.target.dataset.id);
                 const tierIndex = appData.tiers.findIndex(t => t.id === id);
                 if (tierIndex > -1) {
                     const tierName = appData.tiers[tierIndex].name;
                     if (confirm(`Are you sure you want to remove tier "${tierName}" and its influence settings?`)) {
                         delete appData.tierInfluences[id.toString()]; // Use string ID for key
                         appData.tiers.splice(tierIndex, 1);
                         console.log(`Removed tier ${tierName}`);
                         renderTiers();
                     }
                 }
             }
         });
    }

    btnAddTier.addEventListener('click', () => {
        const newTierId = Date.now();
        appData.tiers.push({
            id: newTierId,
            name: `New Tier ${appData.tiers.length + 1}`,
            pk: 0, bk_score: 0, sk_score: 0, cost: 0,
            availableInStates: appData.lifecycleStates.map(s => s.name)
        });
         // Also initialize influences for this new tier
         appData.tierInfluences[newTierId.toString()] = {};
         appData.lifecycleStates.forEach(fromState => {
             appData.tierInfluences[newTierId.toString()][fromState.name] = {};
             appData.lifecycleStates.forEach(toState => {
                 appData.tierInfluences[newTierId.toString()][fromState.name][toState.name] = 1.0;
             });
         });
        renderTiers();
    });

    // --- Lifecycle State Management ---
    function renderLifecycleStates() {
        statesContainer.innerHTML = '';
        appData.lifecycleStates.forEach((state, index) => {
            const div = document.createElement('div');
            div.classList.add('state-item');
            // Keep input/button on the same line
            div.innerHTML = `
                <div style="display: flex; align-items: center;">
                   <span style="margin-right: 10px; min-width: 50px;">State ${index + 1}:</span>
                   <input type="text" class="state-name" value="${state.name}" data-id="${state.id}" placeholder="State Name" style="flex-grow: 1; margin-right: 10px; margin-bottom: 0;">
                   ${appData.lifecycleStates.length > 1 ? `<button class="btn-remove-state" data-id="${state.id}" style="margin-top: 0;">Remove</button>` : ''}
                </div>
            `;
            statesContainer.appendChild(div);
        });
        addStateEventListeners();
        populateMissingTransitions(); // Ensure transitions are up-to-date *before* rendering
        renderBaselineTransitions();
        renderTierInfluences();
        renderTiers();
    }

     function addStateEventListeners() {
        statesContainer.addEventListener('blur', (e) => {
            if (e.target.classList.contains('state-name')) {
                handleStateNameChange(e.target);
            }
        }, true);
        statesContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('state-name')) {
                e.target.blur();
            }
        });
        statesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-state')) {
                handleRemoveState(e.target);
            }
        });
    }

    function handleStateNameChange(inputElement) {
        const id = parseInt(inputElement.dataset.id);
        const stateIndex = appData.lifecycleStates.findIndex(s => s.id === id);
        if (stateIndex === -1) return;

        const oldState = appData.lifecycleStates[stateIndex];
        const oldName = oldState.name;
        const newName = inputElement.value.trim();

        if (!newName) {
            alert("State name cannot be empty.");
            inputElement.value = oldName; return;
        }
        if (newName === oldName) return;

        if (appData.lifecycleStates.some(s => s.name.toLowerCase() === newName.toLowerCase() && s.id !== id)) {
            alert(`State name "${newName}" already exists.`);
            inputElement.value = oldName; return;
        }

        console.log(`Renaming state "${oldName}" to "${newName}"`);
        oldState.name = newName;

        // Update data structures
        updateStateNameInData(oldName, newName);

        renderAll(); // Full re-render to reflect changes everywhere
    }

    function handleRemoveState(buttonElement) {
        const id = parseInt(buttonElement.dataset.id);
        const stateIndex = appData.lifecycleStates.findIndex(s => s.id === id);
        if (stateIndex === -1) return;

        const stateToRemove = appData.lifecycleStates[stateIndex];
        const stateName = stateToRemove.name;

        if (!confirm(`Remove state "${stateName}"? This affects transitions, tier availability, and initial counts.`)) return;

        console.log(`Removing state "${stateName}"`);
        appData.lifecycleStates.splice(stateIndex, 1);

        // Update data structures
        removeStateFromData(stateName);

        renderAll();
    }

    // --- Centralized Data Update Functions ---

    function updateStateNameInData(oldName, newName) {
        // Baseline Transitions
        updateStateNameInTransitions(oldName, newName, appData.baselineTransitions);
        // Tier Influences
        for (const tierIdStr in appData.tierInfluences) {
            updateStateNameInTransitions(oldName, newName, appData.tierInfluences[tierIdStr]);
        }
        // Tier Availability
        appData.tiers.forEach(tier => {
            if (tier.availableInStates?.includes(oldName)) {
                tier.availableInStates = tier.availableInStates.map(sName => sName === oldName ? newName : sName);
            }
        });
        // Initial Donors (Input field and stored data if applicable)
        try {
            let initialDonors = JSON.parse(initialDonorsInput.value || '{}');
            if (initialDonors[oldName] !== undefined) {
                initialDonors[newName] = initialDonors[oldName];
                delete initialDonors[oldName];
                initialDonorsInput.value = JSON.stringify(initialDonors);
                if (appData.initialDonors && appData.initialDonors[oldName] !== undefined) {
                     appData.initialDonors[newName] = appData.initialDonors[oldName];
                     delete appData.initialDonors[oldName];
                }
            }
        } catch (e) { console.error("Failed to update initial donors on state rename:", e); }
    }

    function removeStateFromData(stateName) {
        // Baseline Transitions
        delete appData.baselineTransitions[stateName];
        for (const fromState in appData.baselineTransitions) {
            delete appData.baselineTransitions[fromState][stateName];
            normalizeTransitionRow(appData.baselineTransitions[fromState]); // Renormalize remaining
        }
        // Tier Influences
        for (const tierIdStr in appData.tierInfluences) {
            delete appData.tierInfluences[tierIdStr][stateName];
            for (const fromState in appData.tierInfluences[tierIdStr]) {
                delete appData.tierInfluences[tierIdStr][fromState][stateName];
            }
        }
        // Tier Availability
        appData.tiers.forEach(tier => {
            tier.availableInStates = tier.availableInStates?.filter(sName => sName !== stateName);
        });
        // Initial Donors
        try {
            let initialDonors = JSON.parse(initialDonorsInput.value || '{}');
            if (initialDonors[stateName] !== undefined) {
                delete initialDonors[stateName];
                initialDonorsInput.value = JSON.stringify(initialDonors);
                if (appData.initialDonors) delete appData.initialDonors[stateName];
            }
        } catch (e) { console.error("Failed to update initial donors on state removal:", e); }
    }

     // Helper to update state names within a transition object (baseline or tier-specific)
    function updateStateNameInTransitions(oldName, newName, transitionsObject) {
        if (transitionsObject[oldName]) {
            transitionsObject[newName] = transitionsObject[oldName];
            delete transitionsObject[oldName];
        }
        for (const fromState in transitionsObject) {
            if (transitionsObject[fromState] && transitionsObject[fromState][oldName] !== undefined) {
                transitionsObject[fromState][newName] = transitionsObject[fromState][oldName];
                delete transitionsObject[fromState][oldName];
            }
        }
    }

    // Helper to re-normalize a transition row (object like { stateA: 0.5, stateB: 0.6 })
    function normalizeTransitionRow(row) {
        if (!row) return;
        let currentSum = 0;
        for (const state in row) {
            currentSum += row[state] || 0;
        }
        // Only renormalize if sum is positive and significantly different from 1
        if (currentSum > 1e-9 && Math.abs(currentSum - 1.0) > 0.001) {
            console.log("Renormalizing row:", row, "Original sum:", currentSum);
            for (const state in row) {
                row[state] = (row[state] || 0) / currentSum;
            }
        }
    }

    btnAddState.addEventListener('click', () => {
        const newStateName = `State ${appData.lifecycleStates.length + 1}`;
        const newStateId = Date.now();
        appData.lifecycleStates.push({ id: newStateId, name: newStateName });
        populateMissingTransitions(); // Add new state to all transition structures
        renderLifecycleStates(); // Render UI reflecting the new state
    });

    // --- Transition Table Rendering ---

     function renderBaselineTransitions() {
        baselineTransitionsTableContainer.innerHTML = '';
        if (appData.lifecycleStates.length === 0) return;

        let tableHTML = '<table><thead><tr><th>From State</th>';
        appData.lifecycleStates.forEach(s => tableHTML += `<th>To: ${s.name}</th>`);
        tableHTML += '<th>Row Sum</th></tr></thead><tbody>';

        appData.lifecycleStates.forEach(fromState => {
            tableHTML += `<tr><td>${fromState.name}</td>`;
            let rowSum = 0;
            const currentRow = appData.baselineTransitions[fromState.name] || {}; // Ensure row exists

            appData.lifecycleStates.forEach(toState => {
                const prob = currentRow[toState.name] || 0.0; // Default to 0 if mapping missing
                tableHTML += `<td><input type="number" class="baseline-trans-prob" value="${prob.toFixed(3)}" min="0" max="1" step="0.01" data-from="${fromState.name}" data-to="${toState.name}"></td>`;
                rowSum += prob;
            });

            let sumClass = Math.abs(rowSum - 1.0) < 0.001 ? 'valid-sum' : 'invalid-sum';
            if (rowSum === 0) sumClass = ''; // Don't flag zero rows as invalid initially

            tableHTML += `<td class="row-sum ${sumClass}">${rowSum.toFixed(2)}</td></tr>`;
        });
        tableHTML += '</tbody></table>';
        baselineTransitionsTableContainer.innerHTML = tableHTML;
        addBaselineTransitionEventListeners();
    }

    function addBaselineTransitionEventListeners() {
        baselineTransitionsTableContainer.addEventListener('change', (e) => {
             if (e.target.classList.contains('baseline-trans-prob')) {
                const fromStateName = e.target.dataset.from;
                const toStateName = e.target.dataset.to;
                let value = parseFloat(e.target.value);

                if (isNaN(value) || value < 0) value = 0;
                if (value > 1) value = 1;
                e.target.value = value.toFixed(3);

                if (!appData.baselineTransitions[fromStateName]) appData.baselineTransitions[fromStateName] = {};
                appData.baselineTransitions[fromStateName][toStateName] = value;

                // Update Row Sum Display & Validation Class
                let rowSum = 0;
                const rowInputs = baselineTransitionsTableContainer.querySelectorAll(`.baseline-trans-prob[data-from="${fromStateName}"]`);
                rowInputs.forEach(siblingInput => { rowSum += parseFloat(siblingInput.value) || 0; });

                const sumCell = e.target.closest('tr').querySelector('.row-sum');
                sumCell.textContent = rowSum.toFixed(2);
                sumCell.classList.remove('valid-sum', 'invalid-sum');
                if (Math.abs(rowSum - 1.0) < 0.001) { // Use tolerance
                     sumCell.classList.add('valid-sum');
                 } else {
                     sumCell.classList.add('invalid-sum');
                 }
             }
        });
    }

    function renderTierInfluences() {
        tierInfluencesContainer.innerHTML = '';
        if (appData.tiers.length === 0 || appData.lifecycleStates.length === 0) return;

        appData.tiers.forEach(tier => {
             const tierIdStr = tier.id.toString();
             const currentTierInfluences = appData.tierInfluences[tierIdStr] || {}; // Ensure exists

            let tierInfluenceHTML = `<div class="tier-influence-item"><h4>Tier: ${tier.name} (Influence Multipliers)</h4>`;
            tierInfluenceHTML += '<table><thead><tr><th>From State</th>';
            appData.lifecycleStates.forEach(s => tierInfluenceHTML += `<th>To: ${s.name}</th>`);
            tierInfluenceHTML += '</tr></thead><tbody>';

            appData.lifecycleStates.forEach(fromState => {
                 const fromStateInfluences = currentTierInfluences[fromState.name] || {}; // Ensure exists

                tierInfluenceHTML += `<tr><td>${fromState.name}</td>`;
                appData.lifecycleStates.forEach(toState => {
                    const multiplier = fromStateInfluences[toState.name] !== undefined ? fromStateInfluences[toState.name] : 1.0; // Default 1
                    tierInfluenceHTML += `<td><input type="number" class="tier-influence-mult" value="${multiplier}" min="0" step="0.1" data-tier-id="${tier.id}" data-from="${fromState.name}" data-to="${toState.name}"></td>`;
                });
                tierInfluenceHTML += '</tr>';
            });
            tierInfluenceHTML += '</tbody></table></div>';
            tierInfluencesContainer.innerHTML += tierInfluenceHTML;
        });
        addTierInfluenceEventListeners();
    }

    function addTierInfluenceEventListeners() {
        tierInfluencesContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('tier-influence-mult')) {
                const tierId = parseInt(e.target.dataset.tierId);
                const fromStateName = e.target.dataset.from;
                const toStateName = e.target.dataset.to;
                let value = parseFloat(e.target.value);

                 if (isNaN(value) || value < 0) value = 0;
                 e.target.value = value;

                 const tierIdStr = tierId.toString();
                 // Ensure nested structure exists before assignment
                 if (!appData.tierInfluences[tierIdStr]) appData.tierInfluences[tierIdStr] = {};
                 if (!appData.tierInfluences[tierIdStr][fromStateName]) appData.tierInfluences[tierIdStr][fromStateName] = {};

                 appData.tierInfluences[tierIdStr][fromStateName][toStateName] = value;
            }
        });
    }

    // --- Data Persistence ---
    btnSaveData.addEventListener('click', () => {
        try {
            localStorage.setItem('impactTierUserData', JSON.stringify(appData));
            alert('Current setup saved locally!');
        } catch (e) {
            alert('Error saving data.');
            console.error("Save error:", e);
        }
    });

    btnClearData.addEventListener('click', () => {
        if (confirm('Clear saved setup? This cannot be undone.')) {
            localStorage.removeItem('impactTierUserData');
            alert('Saved setup cleared.');
        }
    });

    // --- Simulation Trigger (using Fetch API) ---
    btnRunSimulation.addEventListener('click', async () => {
        resultsArea.style.display = 'none';
        btnRunSimulation.textContent = 'Running Simulation...';
        btnRunSimulation.disabled = true;
        document.querySelectorAll('.invalid-input, .invalid-sum').forEach(el => el.classList.remove('invalid-input', 'invalid-sum')); // Clear previous errors

        // --- STEP 1: Frontend Validation ---
        let isValid = true;

        // Validate Persona Percentages
        let totalPersonaPercentage = appData.personas.reduce((sum, p) => sum + (p.percentage || 0), 0);
        if (Math.abs(totalPersonaPercentage - 1.0) > 0.001 && appData.personas.length > 0) {
            alert('Error: Sum of archetype percentages must be exactly 1 (100%).');
            validatePersonaPercentages(); // Highlight fields
            isValid = false;
        }

        // Validate Baseline Transitions
        for (const fromState of appData.lifecycleStates) {
             let rowSum = 0;
             const rowInputs = baselineTransitionsTableContainer.querySelectorAll(`.baseline-trans-prob[data-from="${fromState.name}"]`);
             rowInputs.forEach(input => { rowSum += parseFloat(input.value) || 0; });

             if (Math.abs(rowSum - 1.0) > 0.001 && appData.lifecycleStates.length > 0) {
                 alert(`Error: Baseline transition probabilities for state "${fromState.name}" must sum to 1.`);
                 // Highlight the sum cell visually
                 const sumCell = baselineTransitionsTableContainer.querySelector(`td.row-sum[data-from="${fromState.name}"]`); // Need to add data-from to sumCell in render
                 if (sumCell) sumCell.classList.add('invalid-sum'); // Assuming render adds the class based on sum
                 isValid = false;
                 // Optionally highlight the whole row's inputs
                 rowInputs.forEach(input => input.classList.add('invalid-input'));
             }
        }

        // Validate Initial Donor Counts JSON
        let initialDonors = {};
        try {
            initialDonors = JSON.parse(initialDonorsInput.value);
            if (typeof initialDonors !== 'object' || initialDonors === null) throw new Error("Not an object");
            // Basic check for negative numbers
            for(const key in initialDonors){
                if(typeof initialDonors[key] !== 'number' || initialDonors[key] < 0){
                    throw new Error(`Count for "${key}" must be a non-negative number.`);
                }
            }
            initialDonorsInput.classList.remove('invalid-input');
        } catch (e) {
             alert("Error parsing Initial Donors JSON: " + e.message);
             initialDonorsInput.classList.add('invalid-input');
             isValid = false;
        }

        if (!isValid) {
            btnRunSimulation.textContent = 'Run Simulation';
            btnRunSimulation.disabled = false;
            return;
        }

        console.log("Input validation passed. Sending data to backend...");

        // --- STEP 2: PREPARE DATA PAYLOAD ---
        // Ensure data is clean before sending
        const payload = {
            personas: appData.personas,
            tiers: appData.tiers,
            lifecycleStates: appData.lifecycleStates,
            baselineTransitions: appData.baselineTransitions,
            tierInfluences: appData.tierInfluences,
            initialDonors: initialDonors,
            discountFactor: parseFloat(discountFactorInput.value),
            simulationPeriods: parseInt(simulationPeriodsInput.value)
        };

        // --- STEP 3: CALL BACKEND API ---
        // !!! IMPORTANT: Replace with your DEPLOYED backend URL !!!
        const backendUrl = 'https://donor-optimization-test.onrender.com'; 
        // const backendUrl = 'http://127.0.0.1:5001/simulate'; // For LOCAL testing with backend on port 5001

        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorMsg = `Backend Error (${response.status}): ${response.statusText}`;
                try { const errorData = await response.json(); errorMsg += ` - ${errorData.error || 'Unknown error'}`; }
                catch (e) { /* Ignore if error response isn't JSON */ }
                throw new Error(errorMsg);
            }

            const results = await response.json();
            console.log("Received results from backend:", results);

            // --- STEP 4: DISPLAY RESULTS ---
            resultsArea.style.display = 'block';

            totalNPVEl.textContent = results.totalNPV.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

            periodContributionsEl.innerHTML = '';
            results.periodContributions.forEach((contrib, i) => {
                const li = document.createElement('li');
                li.textContent = `Period ${i + 1}: ${contrib.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}`;
                periodContributionsEl.appendChild(li);
            });

            const stateNames = appData.lifecycleStates.map(s => s.name);

            // Validate result structure before display
            if (results.donorCountsByState && results.donorCountsByState.length === stateNames.length) {
                displayDonorCounts(results.donorCountsByState, stateNames, payload.simulationPeriods);
            } else {
                console.error("Donor count data structure mismatch from backend.");
                donorCountsChartEl.innerHTML = '<p style="color: red;">Error displaying donor counts.</p>';
                donorCountsLegendEl.innerHTML = ''; // Clear legend too
            }

            if (results.policy && results.policy.length === stateNames.length) {
                displayPolicyTable(results.policy, stateNames, payload.personas, payload.tiers, {});
            } else {
                 console.error("Policy data structure mismatch from backend.");
                policyTableContainer.innerHTML = '<p style="color: red;">Error displaying policy table.</p>';
            }

        } catch (error) {
            console.error("Simulation Fetch Error:", error);
            alert("Failed to run simulation: " + error.message);
            resultsArea.style.display = 'none';
        } finally {
            btnRunSimulation.textContent = 'Run Simulation';
            btnRunSimulation.disabled = false;
        }
    });


    // --- Result Display Functions ---

    function getStateColorClass(index) {
        const colorClasses = ['state-0', 'state-1', 'state-2', 'state-3', 'state-4', 'state-5'];
        return colorClasses[index % colorClasses.length];
    }

    function displayDonorCounts(donorCountsByState, stateNames, numPeriods) {
        donorCountsChartEl.innerHTML = '';
        donorCountsLegendEl.innerHTML = '';

        if (!stateNames || stateNames.length === 0 || !donorCountsByState || donorCountsByState.length !== stateNames.length) {
            donorCountsChartEl.textContent = 'No valid donor count data to display.'; return;
        }

        const chartContainer = document.createElement('div'); chartContainer.className = 'chart-container';
        const title = document.createElement('div'); title.className = 'chart-title'; title.textContent = 'Projected Donor Counts Over Time';
        chartContainer.appendChild(title);
        const chartDiv = document.createElement('div'); chartDiv.className = 'chart'; chartContainer.appendChild(chartDiv);

        let maxPeriodTotal = 0;
        for (let p = 0; p <= numPeriods; p++) {
            let currentPeriodTotal = 0;
            for (let s_idx = 0; s_idx < stateNames.length; s_idx++) {
                currentPeriodTotal += (donorCountsByState[s_idx]?.[p] || 0);
            }
            maxPeriodTotal = Math.max(maxPeriodTotal, currentPeriodTotal);
        }
        const maxScale = maxPeriodTotal > 0 ? maxPeriodTotal * 1.1 : 10;

        const legendDiv = document.createElement('div'); legendDiv.className = 'chart-legend';
        stateNames.forEach((name, s_idx) => {
             const legendItem = document.createElement('div'); legendItem.className = 'legend-item';
             const colorBox = document.createElement('div'); const colorClass = getStateColorClass(s_idx); colorBox.className = `legend-color-box ${colorClass}`;
             const tempBar = document.createElement('div'); tempBar.style.display = 'none'; tempBar.className = `bar ${colorClass}`;
             document.body.appendChild(tempBar);
             try { colorBox.style.backgroundColor = window.getComputedStyle(tempBar).backgroundColor || '#ccc'; }
             catch(e) { colorBox.style.backgroundColor = '#ccc'; }
             document.body.removeChild(tempBar);
             const label = document.createElement('span'); label.textContent = name;
             legendItem.appendChild(colorBox); legendItem.appendChild(label); legendDiv.appendChild(legendItem);
        });
        donorCountsLegendEl.appendChild(legendDiv);

        for (let p = 0; p <= numPeriods; p++) {
            const periodGroup = document.createElement('div'); periodGroup.className = 'period-group';
            const barsContainer = document.createElement('div'); barsContainer.className = 'bars-container';
            stateNames.forEach((name, s_idx) => {
                const count = (donorCountsByState[s_idx]?.[p] || 0);
                const bar = document.createElement('div');
                const heightPercentage = maxScale > 0 ? (count / maxScale) * 100 : 0;
                bar.className = `bar ${getStateColorClass(s_idx)}`;
                bar.style.height = `${Math.max(0, heightPercentage)}%`;
                bar.title = `${name}: ${Math.round(count)} (Period ${p === 0 ? 'Initial' : p})`;
                const barLabel = document.createElement('span'); barLabel.className = 'bar-label'; barLabel.textContent = `${Math.round(count)}`;
                bar.appendChild(barLabel); bar.tabIndex = 0;
                barsContainer.appendChild(bar);
            });
            const periodLabel = document.createElement('div'); periodLabel.className = 'period-label';
            periodLabel.textContent = p === 0 ? 'Initial' : `P${p}`;
            periodGroup.appendChild(barsContainer); periodGroup.appendChild(periodLabel); chartDiv.appendChild(periodGroup);
        }
        donorCountsChartEl.appendChild(chartContainer);
     }

     function displayPolicyTable(policy, stateNames, personasData, tiersData, stateIndexMap) {
         policyTableContainer.innerHTML = '';
         if (!policy || policy.length === 0 || !personasData || personasData.length === 0 || !stateNames || stateNames.length === 0) {
             policyTableContainer.textContent = 'No policy data to display.'; return;
         }
         if (policy.length !== stateNames.length) {
             console.error("Policy rows do not match number of states");
             policyTableContainer.textContent = 'Error: Policy data mismatch.'; return;
         }


         const tierNameMap = {};
         tiersData.forEach((tier, index) => { tierNameMap[index] = tier.name; }); // Uses original index from payload

         let tableHTML = '<table><thead><tr><th>State \\ Archetype</th>';
         personasData.forEach((persona, type_idx) => {
             const percentage = (persona.percentage * 100).toFixed(0);
             tableHTML += `<th>${persona.name || `Type ${type_idx+1}`} (${percentage}%)</th>`;
         });
         tableHTML += '</tr></thead><tbody>';

         stateNames.forEach((sName, s_idx) => {
             tableHTML += `<tr><td>${sName}</td>`;
             if (!policy[s_idx] || policy[s_idx].length !== personasData.length) {
                 console.error(`Policy columns mismatch for state ${sName}`);
                 // Fill row with error message or skip?
                 tableHTML += `<td colspan="${personasData.length}">Error: Policy data mismatch for this state.</td>`;
             } else {
                 personasData.forEach((persona, type_idx) => {
                     const chosenTierOriginalIndex = policy[s_idx][type_idx]; // Should be null or number
                     const tierName = (chosenTierOriginalIndex !== null && tierNameMap[chosenTierOriginalIndex])
                                    ? tierNameMap[chosenTierOriginalIndex]
                                    : '<i>None</i>';
                     tableHTML += `<td>${tierName}</td>`;
                 });
             }
             tableHTML += '</tr>';
         });
         tableHTML += '</tbody></table>';
         policyTableContainer.innerHTML = tableHTML;
     }

    // --- Initial Setup ---
    // Mode selection handles initial rendering.

}); // End DOMContentLoaded