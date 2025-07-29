<?php

class Koppelen
{
    public function doe_koppelen()
    {
        ob_start();

        $output = '
<link href="https://fonts.googleapis.com/css2?family=SasaPro:wght@400;700&family=SansPro:wght@400&display=swap" rel="stylesheet">

<div class="admin-container">

    <div id="project-selector">

        <!-- Knoppen voor het kiezen van een project -->
        <div id="project-buttons">
        <!-- Dynamisch ingevulde knoppen voor projecten -->
        </div>
        <h2 id="selected-project-name"></h2>
        <div id="project-relationship" style="display:none;">

            <div class="list-container">
                <div class="list-box">
                    <h3>Niet-gekoppelde Gemeenten</h3>
                    <ul id="unconnected-list"></ul>
                </div>

                <div class="arrows">
                    <button id="to-right" class="arrow-button" disabled>&rarr;</button>
                    <button id="to-left" class="arrow-button" disabled>&larr;</button>
                    <button id="save-button">Opslaan</button>
                </div>

                <div class="list-box">
                    <h3>Gekoppelde Gemeenten</h3>
                    <ul id="connected-list"></ul>
                </div>
            </div>
        </div>
    </div>
</div>
        <script>
            const ajaxurl = "' . admin_url('admin-ajax.php') . '";
        </script>';
        ?>
<?php wp_enqueue_script('jquery'); // eerst
        ?>
<?php $output .= '

        <script src="' . plugin_dir_url(__FILE__) . 'js/koppel.js"></script>
    ';

        echo $output;
        return ob_get_clean();
    }

}
