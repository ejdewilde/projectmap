jQuery(document).ready(function ($) {
    let selectedProjectId = null;

    // Haal projecten op en voeg ze toe als knoppen
    fetch(ajaxurl + '?action=get_projects')
        .then(response => response.json())
        .then(data => {
            if (data.success) {


                const projecten = data.data;
                const projectButtonsDiv = $('#project-buttons');
                projectButtonsDiv.empty(); // Maak de projectknoppen leeg voordat je nieuwe knoppen toevoegt

                const normaleProjecten = [];
                const overigeProjecten = [];

                // Splits projecten in twee lijsten
                projecten.forEach(project => {
                    if (project.naam.toLowerCase().startsWith('overig')) {
                        overigeProjecten.push(project);
                    } else {
                        normaleProjecten.push(project);
                    }
                });

                // Voeg eerst de normale toe
                normaleProjecten.forEach(project => {
                    const btn = $('<button>')
                        .addClass('project-button')
                        .text(project.naam)
                        .data('project', project)
                        .click(function () {
                            selectedProjectId = project.id;
                            loadProjectData(selectedProjectId); // Laad de gegevens van het geselecteerde project
                            projectButtonsDiv.hide(); // Verberg de projectknoppen nadat een project is gekozen
                            $('#project-title').hide(); // Verberg de titel van het project
                        });;
                    projectButtonsDiv.append(btn);
                });

                // Voeg daarna de 'Overig'-projecten toe met extra klasse
                overigeProjecten.forEach(project => {
                    const btn = $('<button>')
                        .addClass('project-button overig-button')
                        .text(project.naam)
                        .data('project', project)
                        .click(function () {
                            selectedProjectId = project.id;
                            loadProjectData(selectedProjectId); // Laad de gegevens van het geselecteerde project
                            projectButtonsDiv.hide(); // Verberg de projectknoppen nadat een project is gekozen
                            $('#project-title').hide(); // Verberg de titel van het project
                        });;
                    projectButtonsDiv.append(btn);
                });
            } else {
                console.error('Fout bij ophalen van projecten:', data.message);
            }
        })
        .catch(error => console.error('Error bij het ophalen van projecten:', error));

    // Functie om de gegevens van het geselecteerde project te laden
    function loadProjectData(projectId) {
        fetch(ajaxurl + '?action=get_project_gemeenten&project_id=' + projectId)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const connectedGemeenten = Array.isArray(data.data.connected) ? data.data.connected : [];
                    const unconnectedGemeenten = Array.isArray(data.data.unconnected) ? data.data.unconnected : [];

                    // Toon projectnaam
                    $('#selected-project-name').text(data.data.projectName);

                    // Vul de lijsten met gemeenten
                    // Vul de connected-gemeentenlijst
                    const connectedList = $('#connected-list');
                    connectedList.empty();

                    connectedGemeenten.sort((a, b) => a.naam.localeCompare(b.naam));
                    connectedGemeenten.forEach(gemeente => {
                        const li = $('<li>')
                            .text(gemeente.naam)
                            .attr('data-code', gemeente.code); // <- Belangrijk!
                        connectedList.append(li);
                    });

                    // Vul de unconnected-gemeentenlijst
                    const unconnectedList = $('#unconnected-list');
                    unconnectedList.empty();

                    unconnectedGemeenten.sort((a, b) => a.naam.localeCompare(b.naam));
                    unconnectedGemeenten.forEach(gemeente => {
                        const li = $('<li>')
                            .text(gemeente.naam)
                            .attr('data-code', gemeente.code); // <- Ook hier!
                        unconnectedList.append(li);
                    });


                    // Maak de projectrelatie sectie zichtbaar
                    $('#project-relationship').show();
                } else {
                    console.error('Fout bij ophalen van projectgemeenten:', data.message);
                }
            })
            .catch(error => console.error('Fout bij het ophalen van projectgemeenten:', error));
    }

    // Functie om een geselecteerde gemeente te markeren
    function selectGemeente(listId, gemeenteElement) {
        // Verwijder selectie van andere elementen
        $('#' + listId + ' li').removeClass('selected');

        // Markeer het aangeklikte element
        gemeenteElement.addClass('selected');

        // Verlicht de juiste knop (pijl) op basis van de selectie
        if (listId === 'unconnected-list') {
            $('#to-right').prop('disabled', false);
            $('#to-left').prop('disabled', true);
        } else if (listId === 'connected-list') {
            $('#to-left').prop('disabled', false);
            $('#to-right').prop('disabled', true);
        }
        checkButtonState();
    }
    // Functie om knoppen (pijlen) in te schakelen op basis van de selectie
    function checkButtonState() {
        const selectedFromConnected = $('#connected-list li.selected').length > 0;
        const selectedFromUnconnected = $('#unconnected-list li.selected').length > 0;

        if (selectedFromUnconnected) {
            $('#to-right').prop('disabled', false);  // Pijl naar rechts inschakelen
        } else {
            $('#to-right').prop('disabled', true);  // Pijl naar rechts uitschakelen
        }

        if (selectedFromConnected) {
            $('#to-left').prop('disabled', false);  // Pijl naar links inschakelen
        } else {
            $('#to-left').prop('disabled', true);  // Pijl naar links uitschakelen
        }
    }

    // Verplaats gemeente van gekoppeld naar niet-gekoppeld (en vice versa)
    $('#to-right').click(function () {
        moveGemeente('unconnected-list', 'connected-list');
    });

    $('#to-left').click(function () {
        moveGemeente('connected-list', 'unconnected-list');
    });

    // Verplaats gemeente tussen de lijsten
    function moveGemeente(fromListId, toListId) {
        const fromList = $('#' + fromListId);
        const toList = $('#' + toListId);
        const selectedGemeente = fromList.find('li.selected');

        if (selectedGemeente.length) {
            selectedGemeente.removeClass('selected');
            toList.append(selectedGemeente);

            // Na verplaatsen de lijsten opnieuw sorteren
            sortList(fromList);
            sortList(toList);

            // Disable buttons if no selected gemeente
            $('#to-right').prop('disabled', true);
            $('#to-left').prop('disabled', true);
            // Controleer de knopstatus opnieuw
            checkButtonState();
            selectedGemeente.trigger('click');
        }


    }

    // Functie om een lijst alfabetisch te sorteren
    function sortList(list) {
        const listItems = list.children('li').get();
        listItems.sort((a, b) => a.textContent.localeCompare(b.textContent));
        list.empty().append(listItems); // Voeg de gesorteerde items terug toe aan de lijst
    }

    // Opslaan van de koppelingen in de database
    $('#save-button').click(function () {
        $('#connected-list li').each(function () {
            console.log(
                'LI:', $(this).text(),
                '| data-code:', $(this).data('code'),
                '| attr-code:', $(this).attr('data-code')
            );
        });

        const connectedList = $('#connected-list');
        const connectedGemeenten = connectedList.find('li').map(function () {
            return $(this).data('code');
        }).get();

        console.log("voor het opslaan, connected gemeenten:", connectedGemeenten);

        // Maak een AJAX-call om de gekoppelde gemeenten in de database op te slaan
        $.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'save_project_gemeenten',
                projectid: selectedProjectId,
                connected: connectedGemeenten
            },
            success: function (response) {
                if (response.success) {
                    alert('Project is opgeslagen!');
                } else {
                    alert('Er is een fout opgetreden bij het opslaan.');
                }
            },
            error: function () {
                alert('Er is een fout opgetreden bij het opslaan.');
            }
        });
    });
    $('#connected-list').on('click', 'li', function () {
        selectGemeente('connected-list', $(this));
    });

    $('#unconnected-list').on('click', 'li', function () {
        selectGemeente('unconnected-list', $(this));
    });
});

