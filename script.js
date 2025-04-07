let countryData = {};

function loadFertilityAndPopulationData(callback) {
  Papa.parse("data/fertility_rate_2025.csv", {
    download: true,
    header: true,
    complete: function(fertilityResults) {
      Papa.parse("data/population_2025.csv", {
        download: true,
        header: true,
        complete: function(populationResults) {
          const populationMap = {};
          populationResults.data.forEach(row => {
            const country = row.country?.trim();
            const pop = parseInt(row.population);
            if (country && !isNaN(pop)) {
              populationMap[country] = pop;
            }
          });

          fertilityResults.data.forEach(row => {
            const country = row.country?.trim();
            const rate = parseFloat(row.fertility_rate);
            const pop = populationMap[country];
            if (country && !isNaN(rate) && !isNaN(pop)) {
              countryData[country] = {
                fertilityRate: rate,
                initialPopulation: pop
              };
            }
          });

          setupCustomAutocomplete(Object.keys(countryData));
          callback();
        }
      });
    }
  });
}

function setupCustomAutocomplete(countryList) {
  const input = document.getElementById("countryInput");
  const suggestions = document.getElementById("autocomplete-list");

  input.addEventListener("input", function () {
    const val = this.value.toLowerCase();
    suggestions.innerHTML = "";

    if (!val) return;

    const matches = countryList.filter(c =>
      c.toLowerCase().startsWith(val)
    ).slice(0, 10); // limit suggestions

    matches.forEach(country => {
      const div = document.createElement("div");
      div.classList.add("autocomplete-item");
      div.textContent = country;
      div.onclick = () => {
        input.value = country;
        suggestions.innerHTML = "";
      };
      suggestions.appendChild(div);
    });
  });

  document.addEventListener("click", function (e) {
    if (e.target !== input) {
      suggestions.innerHTML = "";
    }
  });
}

function simulatePopulation(fertilityRate, generations, initialPop, survivalRate = 0.95) {
  const pop = [initialPop];
  for (let i = 0; i < generations; i++) {
    const women = pop[i] * 0.5;
    const nextGen = women * fertilityRate * survivalRate;
    pop.push(nextGen);
  }
  return pop;
}

function runSimulation() {
  const country = document.getElementById('countryInput').value.trim();
  const data = countryData[country];

  if (!data) {
    alert("Country not found. Please check the spelling.");
    return;
  }

  const { fertilityRate, initialPopulation } = data;
  const generations = 4;
  const years = Array.from({ length: generations + 1 }, (_, i) => (i * 30));
  const pop = simulatePopulation(fertilityRate, generations, initialPopulation);

  const statsDiv = document.getElementById("stats");
  statsDiv.innerHTML = `<strong>Fertility Rate (2025):</strong> ${fertilityRate.toLocaleString()}<br>`;
  statsDiv.innerHTML += `<strong>Initial Population (2025):</strong> ${initialPopulation.toLocaleString()}<br>`;

  for (let i = 1; i < pop.length; i++) {
    const percentChange = ((pop[i] - pop[0]) / pop[0] * 100).toFixed(2);
    statsDiv.innerHTML += `Generation ${i}: ${percentChange}% change<br>`;
  }

  statsDiv.innerHTML += `<strong>Ending Population (2145):</strong> ${Math.round(pop[pop.length - 1]).toLocaleString()}`;

  const trace = {
    x: years,
    y: pop,
    type: 'scatter',
    mode: 'lines+markers',
    name: country
  };

  const layout = {
    title: `Population Projection for ${country}`,
    xaxis: { title: "Years" },
    yaxis: { title: "Population", range: [0, Math.max(...pop) * 1.1] }
  };

  Plotly.newPlot('plot', [trace], layout);
}

window.onload = () => loadFertilityAndPopulationData(() => {
  console.log("Data loaded and ready.");
});