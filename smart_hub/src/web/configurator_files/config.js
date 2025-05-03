const form_upload = document.getElementById("file_upload");
const form_download = document.getElementById("file_download");
const resp_popup = document.getElementById("resp-popup");
const file_popup = document.getElementById("file_popup");
const save_butt = document.getElementById("config_button_sv")
const protoc_butt = document.getElementById("showlogs_button")
const close_resp_popup_h = document.getElementById("close_resp_popup");
const close_file_popup_h = document.getElementById("close_file_popup");
const close_chan_popup_h = document.getElementById("close_chan_popup");

if (document.getElementById("files_button")) {
    files_button.addEventListener("click", function () {
        file_popup.classList.add("show");
    });
}

if (document.getElementById("chan_reset_button")) {
    chan_reset_button.addEventListener("click", function () {
        chan_popup.classList.add("show");
    });
}


if (document.getElementById("reset_button")) {
    reset_button.addEventListener("click", function () {
        document.getElementById("chan-select").requestSubmit();
    });
}


if (protoc_butt) {
    protoc_butt.addEventListener("click", function () {
        msg_popup.classList.add("show");
    });
}

if (resp_popup) {
    resp_popup.classList.add("show");
}

if (close_resp_popup_h) {
    close_resp_popup_h.addEventListener("click", function () {
        resp_popup.classList.remove("show");
    });
}

if (close_file_popup_h) {
    close_file_popup_h.addEventListener("click", function () {
        file_popup.classList.remove("show");
    });
}
if (close_chan_popup_h) {
    close_chan_popup_h.addEventListener("click", function () {
        chan_popup.classList.remove("show");
    });
}
if (form_upload) {
    form_upload.addEventListener("submit", function () {
        openMsgPopup();
    });
}
if (file_popup) {
    file_popup.addEventListener("click", function (event) {
        if (event.target == file_popup) {
            openMsgPopup();
        };
    });
}
window.addEventListener("click", function (event) {
    if (event.target == file_popup) {
        openMsgPopup();
    };
});
function openMsgPopup() {
    file_popup.classList.remove("show");
    chan_popup.classList.remove("show");
    msg_popup.classList.add("show");
};