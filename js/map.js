let geojsonData = null;
let gemeenteProjecten = [];
let chart = null; // Variabele om de Highcharts kaart op te slaan
// Dit zorgt ervoor dat de projectlijst maar één keer wordt gevuld
let projectListFilled = false;
let projectInfoData = {}; // Object om de projectinformatie apart op te slaan

fetch(ajaxurl + '?action=haal_project_info_op')
    .then(res => res.json())
    .then(data => {
        projectInfoData = data;  // Sla de projectinformatie op
    })
    .catch(err => console.error('Fout bij het ophalen van projectinformatie:', err));


Promise.all([
    fetch(geojsonUrl)
        .then(res => res.json()),
    fetch(ajaxurl + '?action=haal_gemeente_projecten_op')
        .then(res => res.json())])
    .then(([geoData, projecten]) => {
        geojsonData = geoData;
        gemeenteProjecten = projecten;
        renderMap();  // Zorg ervoor dat renderMap wordt aangeroepen na het ophalen van data
    })
    .catch(err => console.error('Fout bij laden GeoJSON:', err));


function renderMap() {
    const mapData = geojsonData.features.map(feature => {
        const code = feature.properties.statcode;
        const gemeenteData = gemeenteProjecten[code];
        const projecten = gemeenteData ? gemeenteData.projecten : [];
        const naam = gemeenteData?.naam || feature.properties.statnaam || 'Onbekend';

        return {
            code: code,
            value: projecten.length,
            projectList: projecten,
            name: naam
        };
    });

    // Bewaar de kaart referentie in de 'chart' variabele
    chart = Highcharts.mapChart('project-map', {
        chart: {
            map: geojsonData
        },
        title: {
            text: ''
        },
        credits: {
            enabled: false
        },
        colorAxis: {
            min: 0,
            maxColor: '#005500',
            minColor: '#eee'
        },
        tooltip: {
            formatter: function () {
                const naam = this.point.options.name || 'Onbekend';
                const projecten = this.point.options.projectList || [];
                if (projecten.length === 0) {
                    return `<b>${naam}</b><br/>(nog) geen Movisie...`;
                } else {
                    return `Movisie projecten in <b>${naam}</b>:<br/>- ${projecten.join('</br>- ')}`;
                }
            }
        },
        series: [{
            data: mapData,
            keys: ['code', 'value', 'projectList', 'name'],
            joinBy: ['statcode', 'code'],
            name: 'Gemeente',
            dataLabels: {
                enabled: false
            },
            states: {
                hover: {
                    color: '#f8a2b1'
                }
            }
        }]
    });
    // Zorg ervoor dat de kaart zichtbaar wordt na het laden
    document.getElementById('project-map').classList.add('loaded');
    if (!projectListFilled) {
        populateProjectList();
        projectListFilled = true;  // Markeer de lijst als gevuld
    }
}

function populateProjectList() {
    const projectList = document.getElementById('project-list');

    const projecten = new Set(); // Gebruik een Set om dubbele projecten te vermijden

    // Verzamel alle unieke projectnamen
    Object.values(gemeenteProjecten).forEach(gemeenteData => {
        gemeenteData.projecten.forEach(project => {
            if (!project.startsWith("Overig")) {
                projecten.add(project);
            }
        });
    });

    // Sorteer de projecten alfabetisch
    const sortedProjects = Array.from(projecten).sort();

    // Maak voor elk project een lijstitem
    sortedProjects.forEach(project => {
        const li = document.createElement('li');
        li.textContent = project;
        li.classList.add('project-item');

        // Voeg hover-effecten toe
        li.addEventListener('mouseover', function () {
            highlightProjectOnHover(project);  // Markeer de gemeenten die deelnemen aan dit project
        });

        li.addEventListener('mouseout', function () {
            renderMap();  // Render de kaart opnieuw naar de originele staat
        });

        // Voeg een click event toe om de toelichting weer te geven
        li.addEventListener('click', function () {
            showProjectDetails(project); // Toon de toelichting
            updateTitle(project); // Werk de titel bij met de projectnaam
            highlightProjectOnHover(project);  // Markeer de gemeenten die deelnemen aan dit project
        });

        projectList.appendChild(li);
    });
}
// Functie om de toelichting voor een project weer te geven
function showProjectDetails(project) {
    const projectDetailsDiv = document.getElementById('project-details');
    const projectToelichting = projectInfoData[project] || 'Geen toelichting beschikbaar.';

    projectDetailsDiv.innerHTML = `${projectToelichting}`;
    projectDetailsDiv.style.display = 'block';  // Maak de toelichting zichtbaar
}

// Functie om de toelichting te verbergen
function hideProjectDetails() {
    const projectDetailsDiv = document.getElementById('project-details');
    projectDetailsDiv.style.display = 'none';  // Verberg de toelichting
}
// Functie om gemeenten te markeren op hover
function highlightProjectOnHover(project) {
    chart.series[0].data.forEach(point => {
        const projecten = point.options.projectList || [];

        // Zoek gemeenten die het geselecteerde project uitvoeren en markeer ze
        if (projecten.includes(project)) {
            point.update({
                color: '#ff7f50'  // Markeer de gemeente met oranje kleur
            });
        }
    });
}

// Voeg event listeners toe voor hover
document.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('mouseover', function () {
        const projectName = item.textContent.trim(); // Haal de naam van het project op
        highlightProjectOnHover(projectName); // Markeer de gemeenten
    });

    item.addEventListener('mouseout', function () {
        renderMap(); // Herstel naar de originele kaartstaat door renderMap opnieuw aan te roepen
    });
});

// Functie om de titel bij te werken met de projectnaam
function updateTitle(project) {
    const headerTitle = document.getElementById('header-title');
    headerTitle.textContent = `Project: ${project}`;
}


// Reset de kaart naar de originele staat
function resetMap() {
    geojsonData.features.forEach(feature => {
        const point = Highcharts.charts[0].get('geojson').get(feature);
        if (point) {
            point.update({ color: '#eee' });
        }
    });
}