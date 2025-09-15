<?php

function haal_gemeente_projecten_op()
{
    global $wpdb;

    $result = $wpdb->get_results("
        SELECT p.naam as project, g.code, g.naam
        FROM projecten p
        INNER JOIN vng_projecten pg ON p.id = pg.projectID
        INNER JOIN vng_gemeenten g ON pg.gmcode = g.code
        WHERE p.bewaren = 1
        ORDER BY p.naam
    ");

    // Groepeer per gemeente
    $data = [];
    foreach ($result as $row) {
        if (! isset($data[$row->code])) {
            $data[$row->code] = [
                'naam'      => $row->naam,
                'projecten' => [],
            ];
        }
        $data[$row->code]['projecten'][] = $row->project;
    }
    //wp_send_json("jojo");
    wp_send_json($data);
}

function haal_project_info_op()
{
    global $wpdb;

    $result = $wpdb->get_results("
        SELECT naam, info
        FROM projecten 
        ORDER BY naam");

    $data = [];
    foreach ($result as $row) {
        $data[$row->naam] = $row->info;
    }

    wp_send_json($data);
}

add_action('wp_ajax_get_projects', 'get_projects');

function get_projects()
{
    global $wpdb;

    $results = $wpdb->get_results("SELECT * FROM projecten WHERE bewaren = 1 ORDER BY naam", ARRAY_A);

    wp_send_json_success($results);
}

add_action('wp_ajax_get_gemeenten', 'get_gemeenten');
function get_gemeenten()
{
    global $wpdb;

    $results = $wpdb->get_results("SELECT * FROM vng_gemeenten", ARRAY_A);

    wp_send_json($results);
}
add_action('wp_ajax_get_linked_gemeenten', 'get_linked_gemeenten');

function get_linked_gemeenten()
{
    global $wpdb;

    $project_id = isset($_POST['project_id']) ? intval($_POST['project_id']) : 0;

    if (! $project_id) {
        wp_send_json_error(['message' => 'Ongeldig project ID']);
        return;
    }

    $results = $wpdb->get_results(
        $wpdb->prepare("SELECT g.* FROM vng_projecten vp
                        JOIN vng_gemeenten g ON vp.gmcode = g.code
                        WHERE vp.projectID = %d order by naam", $project_id),
        ARRAY_A
    );

    wp_send_json($results);
}

add_action('wp_ajax_get_unlinked_gemeenten', 'get_unlinked_gemeenten');
function get_unlinked_gemeenten()
{
    global $wpdb;

    $project_id = isset($_POST['project_id']) ? intval($_POST['project_id']) : 0;

    if (! $project_id) {
        wp_send_json_error(['message' => 'Ongeldig project ID']);
        return;
    }

    $results = $wpdb->get_results(
        $wpdb->prepare("SELECT g.* FROM vng_gemeenten g
                        WHERE g.code NOT IN
                        (SELECT gmcode FROM vng_projecten WHERE projectID = %d)", $project_id),
        ARRAY_A
    );

    wp_send_json($results);
}

add_action('wp_ajax_link_gemeentes_to_project', 'link_gemeentes_to_project');
function link_gemeentes_to_project()
{
    global $wpdb;

    $project_id = isset($_POST['project_id']) ? intval($_POST['project_id']) : 0;
    $gemeentes  = isset($_POST['gemeentes']) ? $_POST['gemeentes'] : [];

    if (! $project_id || empty($gemeentes)) {
        wp_send_json_error(['message' => 'Ongeldige gegevens']);
        return;
    }

    foreach ($gemeentes as $gmcode) {
        // Koppel gemeente aan project
        $wpdb->insert('vng_projecten', [
            'projectID' => $project_id,
            'gmcode'    => $gmcode,
        ]);
    }

    wp_send_json(['message' => 'Gemeenten succesvol gekoppeld']);
}

add_action('wp_ajax_unlink_gemeentes_from_project', 'unlink_gemeentes_from_project');
function unlink_gemeentes_from_project()
{
    global $wpdb;

    $project_id = isset($_POST['project_id']) ? intval($_POST['project_id']) : 0;
    $gemeentes  = isset($_POST['gemeentes']) ? $_POST['gemeentes'] : [];

    if (! $project_id || empty($gemeentes)) {
        wp_send_json_error(['message' => 'Ongeldige gegevens']);
        return;
    }

    foreach ($gemeentes as $gmcode) {
        // Verwijder de koppeling van het project
        $wpdb->delete('vng_projecten', [
            'projectID' => $project_id,
            'gmcode'    => $gmcode,
        ]);
    }

    wp_send_json(['message' => 'Gemeenten succesvol ontkoppeld']);
}

add_action('wp_ajax_save_project_gemeenten', 'save_project_gemeenten');

function save_project_gemeenten()
{
    global $wpdb;

    $projectid = isset($_POST['projectid']) ? intval($_POST['projectid']) : 0;
    $connected = isset($_POST['connected']) ? $_POST['connected'] : [];

    if ($projectid === 0) {
        wp_send_json_error(['message' => 'Ongeldig project ID']);
        return;
    }

    if (! is_array($connected)) {
        wp_send_json_error(['message' => 'Ongeldige gegevens ontvangen']);
        return;
    }

    // Verwijder bestaande koppelingen
    $wpdb->delete('vng_projecten', ['projectID' => $projectid]);

    // Voeg nieuwe koppelingen toe (via gmcode, dus geen ID's meer nodig)
    foreach ($connected as $gmcode) {
        // Optioneel: controleer op geldig formaat (bijv. GM1234)
        if (preg_match('/^GM\d{4}$/', $gmcode)) {
            $wpdb->insert(
                'vng_projecten',
                [
                    'projectID' => $projectid,
                    'gmcode'    => $gmcode,
                ]
            );
        }
    }

    wp_send_json_success([
        'message' => 'Gemeenten succesvol opgeslagen.',
        'count'   => count($connected),
    ]);
}

// Haal de gekoppelde en niet-gekoppelde gemeenten voor een project op
add_action('wp_ajax_get_project_gemeenten', 'get_project_gemeenten');

function get_project_gemeenten()
{
    global $wpdb;

    // Verkrijg het projectID via de GET request
    $projectId = isset($_GET['project_id']) ? intval($_GET['project_id']) : 0;

    if ($projectId === 0) {
        wp_send_json_error(['message' => 'Ongeldig project ID']);
        return;
    }

    // Haal de gekoppelde gemeenten op
    $connectedGemeenten = $wpdb->get_results(
        $wpdb->prepare("SELECT * FROM vng_gemeenten g
            INNER JOIN vng_projecten p ON g.code = p.gmcode
            WHERE p.projectID = %d ORDER BY naam", $projectId),
        ARRAY_A
    );

    // Haal de niet-gekoppelde gemeenten op
    $unconnectedGemeenten = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM vng_gemeenten
            WHERE code NOT IN (
                SELECT gmcode
                FROM vng_projecten
                WHERE projectID = %d ORDER BY naam
            )",
            $projectId
        ),
        ARRAY_A
    );

    // Controleer of de gegevens zijn opgehaald
    if (is_array($connectedGemeenten) && is_array($unconnectedGemeenten)) {
        wp_send_json_success([
            'projectName' => get_project_name($projectId), // Verkrijg de projectnaam
            'connected'   => $connectedGemeenten,
            'unconnected' => $unconnectedGemeenten,
        ]);
    } else {
        wp_send_json_error(['message' => 'Fout bij ophalen projectgemeenten']);
    }
}

// Haal de projectnaam op uit de projecten tabel (gebaseerd op projectID)
function get_project_name($projectId)
{
    global $wpdb;
    $project = $wpdb->get_row(
        $wpdb->prepare("SELECT naam FROM projecten WHERE id = %d", $projectId),
        ARRAY_A
    );
    return $project ? $project['naam'] : 'Onbekend project';
}
// AJAX voor toevoegen van nieuw project (ingelogde gebruikers)
add_action('wp_ajax_add_new_project', 'add_new_project_callback');

function add_new_project_callback()
{
    global $wpdb;

    $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : '';

    if (empty($name)) {
        wp_send_json_error(['message' => 'Projectnaam mag niet leeg zijn']);
        wp_die();
    }

    $table =  'projecten'; // Pas aan naar je tabel
    $wpdb->insert($table, ['naam' => $name]);
    $project_id = $wpdb->insert_id;

    if ($project_id) {
        wp_send_json_success([
            'id' => $project_id,
            'naam' => $name
        ]);
    } else {
        wp_send_json_error(['message' => 'Kon project niet toevoegen']);
    }

    wp_die();
}
// AJAX voor "verwijderen" van project door bewaren op 0 te zetten
add_action('wp_ajax_delete_project', 'delete_project_callback');

function delete_project_callback()
{
    global $wpdb;

    $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : '';

    if (empty($name)) {
        wp_send_json_error(['message' => 'Geen projectnaam ontvangen']);
        wp_die();
    }

    $table = 'projecten'; // Pas aan naar jouw tabel
    $updated = $wpdb->update(
        $table,
        ['bewaren' => 0],      // nieuwe waarde
        ['naam' => $name],      // WHERE clause
        ['%d'],                 // type van nieuwe waarde
        ['%s']                  // type van WHERE waarde
    );

    if ($updated !== false) {
        wp_send_json_success(['message' => 'Project succesvol verwijderd']);
    } else {
        wp_send_json_error(['message' => 'Kon project niet bijwerken']);
    }

    wp_die();
}

// AJAX voor ophalen van de toelichting
add_action('wp_ajax_get_toelichting', 'get_toelichting_callback');
function get_toelichting_callback()
{
    global $wpdb;

    $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : '';
    if (empty($name)) {
        wp_send_json_error(['message' => 'Geen projectnaam opgegeven']);
        wp_die();
    }

    $table = 'projecten'; // pas aan naar je tabel
    $toelichting = $wpdb->get_var($wpdb->prepare(
        "SELECT info FROM $table WHERE naam = %s",
        $name
    ));

    wp_send_json_success(['toelichting' => $toelichting ?? '']);
    wp_die();
}

// AJAX voor bijwerken van de toelichting
add_action('wp_ajax_update_toelichting', 'update_toelichting_callback');
function update_toelichting_callback()
{
    global $wpdb;

    $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : '';
    $titel = isset($_POST['titel']) ? sanitize_text_field($_POST['titel']) : '';
    $toelichting = isset($_POST['toelichting']) ? sanitize_textarea_field($_POST['toelichting']) : '';

    if (empty($name)) {
        wp_send_json_error(['message' => 'Geen projectnaam opgegeven']);
        wp_die();
    }
    if (empty($titel)) {
        wp_send_json_error(['message' => 'Geen projectnaam opgegeven']);
        wp_die();
    }

    $table = 'projecten'; // pas aan naar je tabel
    $updated = $wpdb->update(
        $table,
        ['info' => $toelichting, 'naam' => $titel], // nieuwe waarden
        ['naam' => $name],
    );

    if ($updated !== false) {
        wp_send_json_success(['message' => 'Toelichting succesvol bijgewerkt']);
    } else {
        wp_send_json_error(['message' => 'Kon toelichting niet bijwerken']);
    }

    wp_die();
}