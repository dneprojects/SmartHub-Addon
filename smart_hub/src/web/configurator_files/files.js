const form_upload = document.getElementById("file_upload");
const form_download = document.getElementById("file_download");
const updates_butt = document.getElementById("updates_button");
const updates_pop = document.getElementById("updates_popup");
const close_updates_pop = document.getElementById("close_updates_popup");
const form_doc = document.getElementById("file_doc");
const mod_type_sel = document.getElementsByName("mod_type_select");
const sys_download = document.getElementsByName("SysDownload");
const sys_doc = document.getElementsByName("SysDoc");
const bak_restore = document.getElementsByName("SysRestore");
const sys_upload = document.getElementsByName("SysUpload");
const file_button_l = document.getElementById("file_button_l");
const sys_upload_l = document.getElementById("sys_upload");
const wait_msg_popup = document.getElementById("msg_popup");
let intervalId;
let pending;

if (document.getElementById("form_doc")) {
    form_doc.addEventListener("submit", function () {
        file_popup.classList.remove("show");
    });
}
if (document.getElementById("form_upload")) {
    form_upload.addEventListener("submit", function () {
        openMsgPopup("");
    });
}

if (file_button_l) {
    file_button_l.addEventListener("change", function () {
        handle_local_button();
    });
    handle_local_button();
}
if (sys_upload_l) {
    sys_upload_l.addEventListener("change", function () {
        handle_upload_button();
    });
    handle_upload_button();
}


if (document.getElementById("config_button")) {
    document.getElementById("config_button").addEventListener("click", function () {
        wait_msg_popup.innerHTML = wait_msg_popup.innerHTML.replace("ContentTitle", "Neue Initialisierung")
        wait_msg_popup.innerHTML = wait_msg_popup.innerHTML.replace("Upload", "Bitte warten...")
        openMsgPopup("modules");
    });
}
if (sys_download) {
    if (sys_download.length) {
        sys_download[0].addEventListener("click", function () {
            file_popup.classList.remove("show");
        });
    }

}
if (bak_restore) {
    if (bak_restore.length) {
        bak_restore[0].addEventListener("click", function () {
            wait_msg_popup.innerHTML = wait_msg_popup.innerHTML.replace("ContentTitle", "System wird neu geladen")
            wait_msg_popup.innerHTML = wait_msg_popup.innerHTML.replace("Upload", "Bitte warten...")
            openMsgPopup("hub");
        });
    }
}
if (sys_upload) {
    if (sys_upload.length) {
        sys_upload[0].addEventListener("click", function () {
            wait_msg_popup.innerHTML = wait_msg_popup.innerHTML.replace("ContentTitle", "System wird neu geladen")
            wait_msg_popup.innerHTML = wait_msg_popup.innerHTML.replace("Upload", "Bitte warten...")
            openMsgPopup("hub");
        });
    }
}
if (sys_doc) {
    if (sys_doc.length) {
        sys_doc[0].addEventListener("click", function () {
            file_popup.classList.remove("show");
        });
    }
}
files_button.addEventListener("click", function () {
    file_popup.classList.add("show");
});
close_file_popup.addEventListener("click", function () {
    file_popup.classList.remove("show");
});
form_upload.addEventListener("submit", function () {
    openMsgPopup("");
});
if (updates_butt)
    updates_butt.addEventListener("click", function () {
        updates_pop.classList.add("show");
    });
if (close_updates_pop)
    close_updates_pop.addEventListener("click", function () {
        updates_pop.classList.remove("show");
    });
if (mod_type_sel) {
    if (mod_type_sel.length) {
        mod_type_sel[0].addEventListener("change", function () {
            document.getElementById("loc_mod_fw_update").requestSubmit();
        });
    }
}
window.addEventListener("click", function (event) {
    if (event.target == file_popup) {
        openMsgPopup("");
    };
});
function openMsgPopup(url) {
    if (file_popup)
        file_popup.classList.remove("show");
    wait_msg_popup.classList.add("show");
    if (updates_pop)
        updates_pop.classList.remove("show");
    if (url != "") {
        watchWaitStatus(url);
    }

};
function handle_local_button() {
    if (file_button_l.selectedIndex)
        bak_restore[0].disabled = false;
    else {
        bak_restore[0].disabled = true;
    }
}

function handle_upload_button() {
    if (sys_upload_l.value == "")
        sys_upload[0].disabled = true;
    else {
        sys_upload[0].disabled = false;
    }

}
async function watchWaitStatus(url) {

    pending = false;
    intervalId = setInterval(function () {
        // alle 3 Sekunden ausführen 
        getWaitStatus(url);
    }, 3000);
}

function getWaitStatus(url) {
    const statusUrl = "wait_status"
    if (url == "") {
        url = "modules";
    }
    if (pending)
        return;
    pending = true;
    fetch(statusUrl)
        .then((resp) => resp.text())
        .then(function (text) {
            pending = false;
            if (text == "locked") {
                return;
            }
            if (text == "finished") {
                clearInterval(intervalId);
                window.location.replace(url);
                return;
            }
            setStatus(text);
        })
        .catch(function (error) {
            pending = false;
            console.log(error);
        });
}