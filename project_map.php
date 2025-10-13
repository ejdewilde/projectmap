<?php
class Project_Map
{
    public function get_map()
    {
        ob_start();

        $output = '
<link href="https://fonts.googleapis.com/css2?family=SasaPro:wght@400;700&family=SansPro:wght@400&display=swap" rel="stylesheet">

<div class="parent">
  <!-- Titel en projectinformatie -->
  <div id="header">
    <h2 id="header-title">Samenwerkingsprojecten gemeenten en Movisie</h2>
<div id="project-details"></div>
  </div>

  <!-- Kaart links -->
  <div id="project-map"></div>

  <!-- Zijbalk rechts -->
  <div id="sidebar">
    <ul id="project-list"></ul>

  </div>
</div>




        <script src="https://code.highcharts.com/maps/highmaps.js"></script>
        <script src="https://code.highcharts.com/modules/exporting.js"></script>
        <script src="https://code.highcharts.com/maps/modules/accessibility.js"></script>

        <script>
            const geojsonUrl = "' . plugin_dir_url(__FILE__) . 'js/gemeente_2025.geojson";
            const ajaxurl = "' . admin_url('admin-ajax.php') . '";
        </script>

        <script src="' . plugin_dir_url(__FILE__) . 'js/map.js"></script>
    ';

        echo $output;

        return ob_get_clean();
    }

}