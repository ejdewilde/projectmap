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
                        });
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
                        });
                    projectButtonsDiv.append(btn);
                });

                //Maak de projectrelatie sectie zichtbaar
                $('#add-project-container').show();

            } else {
                console.error('Fout bij ophalen van projecten:', data.message);
            }
        })
        .catch(error => console.error('Error bij het ophalen van projecten:', error));

    // Functie om de gegevens van het geselecteerde project te laden
    function loadProjectData(projectId) {
        $('#add-project-container').hide();
        fetch(ajaxurl + '?action=get_project_gemeenten&project_id=' + projectId)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const connectedGemeenten = Array.isArray(data.data.connected) ? data.data.connected : [];
                    const unconnectedGemeenten = Array.isArray(data.data.unconnected) ? data.data.unconnected : [];

                    // Toon projectnaam

                    $('#selected-project-name').text(data.data.projectName);
                    const toelichting = loadToelichting(data.data.projectName);
                    $('#toelichting_input').text(toelichting);

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
                    // Zet de projectId als data-attribuut op de titel
                    $("#selected-project-name")
                        .text(data.data.projectName)
                        .data("project-id", projectId);


                    // eventueel ook de huidige toelichting als data-attribuut

                    // Maak de projectrelatie sectie zichtbaar
                    $('#project-relationship').show();

                } else {
                    console.error('Fout bij ophalen van projectgemeenten:', data.message);
                }
            })
            .catch(error => console.error('Fout bij het ophalen van projectgemeenten:', error));
    }

    function selectGemeente(listId, gemeenteElement) {
        // Toggle selectie
        gemeenteElement.toggleClass('selected');

        // Enable/disable de pijlen op basis van of er een geselecteerde LI is
        const selectedFromConnected = $('#connected-list li.selected').length > 0;
        const selectedFromUnconnected = $('#unconnected-list li.selected').length > 0;

        $('#to-right').prop('disabled', !selectedFromUnconnected);
        $('#to-left').prop('disabled', !selectedFromConnected);
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

    // Nieuw project aanmaken via AJAX
    $('#add-project-form').submit(function (e) {
        e.preventDefault(); // voorkom pagina-refresh

        const projectName = $('#new-project-name').val().trim();
        if (!projectName) return; // geen lege naam

        $.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'add_new_project',  // WordPress AJAX action
                name: projectName
            },
            success: function (response) {
                if (response.success) {
                    const project = response.data;

                    // Voeg nieuwe knop toe aan het project-buttons div
                    const button = $('<button>')
                        .text(project.naam)
                        .click(function () {
                            selectedProjectId = project.id;
                            loadProjectData(selectedProjectId);
                            $('#project-buttons').hide();
                            $('#project-title').hide();
                        });

                    $('#project-buttons').append(button);

                    // Maak het formulier leeg
                    $('#new-project-name').val('');

                    alert('Project "' + project.naam + '" is toegevoegd!');
                    location.reload();
                } else {
                    alert('Fout bij toevoegen project: ' + response.message);
                }
            },
            error: function () {
                alert('Er is een fout opgetreden bij het toevoegen van het project.');
            }
        });

    });

    $('#remove_project').click(function () {
        const projectName = $('#selected-project-name').text();

        if (!projectName) {
            alert('Geen project geselecteerd.');
            return;
        }

        if (!confirm(`Weet je zeker dat je project "${projectName}" wilt verwijderen?`)) {
            return;
        }

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'delete_project',
                name: projectName
            },
            success: function (response) {
                if (response.success) {
                    alert(response.data.message);
                    // Verwijder projectbutton uit de lijst
                    $(`#project-buttons .project-button:contains("${projectName}")`).remove();
                    $('#selected-project-name').text('');
                    $('#project-relationship').hide();
                } else {
                    alert('Fout: ' + response.data.message);
                }
            },
            error: function () {
                alert('Er is een fout opgetreden bij de server.');
            }
        });
        location.reload();

    });

    $('#save_toelichting').click(function () {
        const projectName = $('#selected-project-name').text();
        const toelichting = $('#toelichting-input').val();

        if (!projectName) {
            alert('Geen project geselecteerd.');
            return;
        }

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'update_toelichting',
                name: projectName,
                toelichting: toelichting
            },
            success: function (response) {
                if (response.success) {
                    alert(response.data.message);
                } else {
                    alert('Fout: ' + response.data.message);
                }
            },
            error: function () {
                alert('Er is een fout opgetreden bij de server.');
            }
        });

    });
    // Als een project geselecteerd wordt, haal de toelichting op
    function loadToelichting(projectName) {
        // AJAX call om de huidige toelichting op te halen
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'get_toelichting', // deze moet je nog aanmaken in PHP
                name: projectName
            },
            success: function (response) {
                if (response.success) {
                    $('#toelichting_input').val(response.data.toelichting);
                    $('#titel_input').val(projectName);
                } else {
                    $('#toelichting_input').val('');
                }
            }
        });
    }

    // Klik op bijwerken
    $('#update_toelichting').click(function () {
        const projectName = $('#selected-project-name').text();
        const toelichting = $('#toelichting_input').val();
        const nieuwetitel = $('#titel_input').val();

        if (!projectName) {
            alert('Geen project geselecteerd.');
            return;
        }

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'update_toelichting',
                name: projectName,
                titel: nieuwetitel,
                toelichting: toelichting
            },
            success: function (response) {
                if (response.success) {
                    alert(response.data.message);
                    $('#selected-project-name').text(nieuwetitel);
                } else {
                    alert('Fout: ' + response.data.message);
                }
            },
            error: function () {
                alert('Er is een fout opgetreden bij de server.');
            }
        });
    });

});

