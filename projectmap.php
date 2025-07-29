<?php
/*
 * Plugin Name: Projectmap
 * Description: interactieve kaart Movisieprojecten
 * Version: 1.0
 * Author: Erik Jan de Wilde
 * License: GPL v2 or later
 * Text Domain: projectmap
 *
 */

defined('ABSPATH') or die('Nee da mag nie');
ini_set('display_errors', 'On');
ini_set('error_reporting', E_ERROR);

function tsp($test)
{ // for debug/development only
    echo '<pre>';
    //echo 'er wordt momenteel aan de rapportage gewerkt, vandaar deze technische mededelingen</br>';
    echo '----------------------------------------------------------------------------------</br>';
    echo print_r($test, true);
    echo '</pre>';
}

// Include vereiste PHP-bestanden

require_once __DIR__ . '/verwerk_data.php';
require_once __DIR__ . '/project_map.php';
require_once __DIR__ . '/koppelen.php';

// AJAX-acties registreren voor ingelogde en uitgelogde gebruikers

add_action('wp_ajax_haal_gemeente_projecten_op', 'haal_gemeente_projecten_op');
add_action('wp_ajax_nopriv_haal_gemeente_projecten_op', 'haal_gemeente_projecten_op');

add_action('wp_ajax_haal_project_info_op', 'haal_project_info_op');
add_action('wp_ajax_nopriv_haal_project_info_op', 'haal_project_info_op');

add_action('wp_ajax_get_linked_gemeenten', 'get_linked_gemeenten');
add_action('wp_ajax_nopriv_get_linked_gemeenten', 'get_linked_gemeenten');

add_action('wp_ajax_get_unlinked_gemeenten', 'get_unlinked_gemeenten');
add_action('wp_ajax_nopriv_get_unlinked_gemeenten', 'get_unlinked_gemeenten');

add_action('wp_ajax_get_gemeenten', 'get_gemeenten');
add_action('wp_ajax_nopriv_get_gemeenten', 'get_gemeenten');

add_action('wp_ajax_get_projects', 'get_projects');
add_action('wp_ajax_nopriv_get_projects', 'get_projects');

add_action('wp_ajax_get_project_gemeenten', 'get_project_gemeenten');
add_action('wp_ajax_nopriv_get_project_gemeenten', 'get_project_gemeenten');

add_action('wp_ajax_save_project_gemeenten', 'save_project_gemeenten');
add_action('wp_ajax_nopriv_save_project_gemeenten', 'save_project_gemeenten');

// Shortcode [gemscan] – interactieve vragenlijst
function project_map_shortcode()
{
    // Enqueue en lokaliseer script
    wp_enqueue_script('projectmap', plugin_dir_url(__FILE__) . 'js/map.js', ['highcharts', 'highcharts-maps', 'highcharts-nl'], '1.0', true);

    $map = new Project_Map();
    return $map->get_map();
}

add_shortcode('koppelen', 'koppel_shortcode');
// Shortcode [gemscan] – interactieve vragenlijst
function koppel_shortcode()
{
    // Enqueue en lokaliseer script
    $map = new Koppelen();
    return $map->doe_koppelen();
}

add_shortcode('projectmap', 'project_map_shortcode');
// Enqueue externe libraries en CSS (TomSelect en hoofdstylesheet)
function projectmap_enqueue_libraries()
{
    wp_enqueue_style('projectmap-css', plugin_dir_url(__FILE__) . 'css/style.css');
}
add_action('wp_enqueue_scripts', 'projectmap_enqueue_libraries');
