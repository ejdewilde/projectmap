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
        <div id="project-relationship" class="adm_parent" style="display:none;">           
            <div class="adm_boven"> 
            <p style="margin-top:10px;">Verander de naam van het project of de toelichting. Sleep gemeenten van de ene naar de andere lijst of gebruik de pijltjes om gemeenten te koppelen of te ontkoppelen.</p>
            <h2 id="selected-project-name"></h2>
                <!-- Toelichting -->
                <div id="toelichting_container" style="display:flex; flex-direction:column; margin-top:10px;">
                    <label for="titel_input" style="margin-bottom:4px;">Naam:</label>
                    <textarea id="titel_input" rows="1" style="width:100%; padding:6px; resize:vertical;"></textarea>                   
                    <label for="toelichting_input" style="margin-bottom:4px;">Toelichting:</label>
                    <textarea id="toelichting_input" rows="4" style="width:100%; padding:6px; resize:vertical;"></textarea>
                    <button type="button" id="update_toelichting" class="btn btn-primary" style="padding:6px 12px; margin-top:6px; align-self:flex-start;">Bijwerken</button>
                    <button type="button" id="remove_project" class="btn btn-alert" style="padding:6px 12px; margin-top:6px; align-self:flex-start;">Project verwijderen</button>
                </div>

                       </div>
         <div class="adm_li">
                <h3>Niet-gekoppelde Gemeenten</h3>
                <ul id="unconnected-list"></ul>
            </div>
            <div class="adm_mi">
                <button id="to-right" class="arrow-button" disabled>&rarr;</button>
                <button id="to-left" class="arrow-button" disabled>&larr;</button>
                <button id="save-button">Opslaan</button>
            </div>
            <div class="adm_re">
                <h3>Gekoppelde Gemeenten</h3>
                <ul id="connected-list"></ul>
            </div>
        </div>
    </div>                                                                                                                                                                                                          
    <div id="add-project-container" style="margin-top:30px;">
        <h3>Nieuw project aanmaken</h3>
        <form id="add-project-form">
            <div id="add-project-section" style="margin-top:20px; display:flex; gap:10px; align-items:center;">
                <input type="text" id="new-project-name" placeholder="Projectnaam" required style="flex:1; padding:5px;">
                <button type="submit" style="padding:6px 12px;">Project toevoegen</button>
            </div>
        </form>
    </div>
</div>

<script>
    const ajaxurl = "' . admin_url('admin-ajax.php') . '";

    jQuery(document).ready(function($){

        // Toelichting knop
        $("#add_info").on("click", function(){
            const projectId = $("#selected-project-name").data("project-id");
            if(!projectId){
                alert("Selecteer eerst een project.");
                return;
            }
            const currentInfo = $(this).data("info") || "";
            const info = prompt("Voer een toelichting in voor dit project:", currentInfo);
            if(info !== null){
                $.post(ajaxurl, {
                    action: "update_project_info",
                    project_id: projectId,
                    info: info
                }, function(response){
                    if(response.success){
                        alert("Toelichting opgeslagen.");
                        $("#add_info").data("info", info); // lokaal bijwerken
                    } else {
                        alert("Fout bij opslaan toelichting.");
                    }
                });
            }
        });

    });
</script>';

        wp_enqueue_script('jquery'); // eerst
        $output .= '<script src="' . plugin_dir_url(__FILE__) . 'js/koppel.js"></script>';

        echo $output;
        return ob_get_clean();
    }
}