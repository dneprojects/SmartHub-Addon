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
const allInputs = document.querySelectorAll("input");
var rtrfw_filename = document.getElementById("upld_filename");
var modfw_filename = document.getElementById("upld_filename");
const file_upload_edit = document.getElementById("file_upload_edit");

allInputs.forEach((input) => {
  if (input.type === "file" && input.id === "upd_updwnload") {
    if (input.accept === ".rbin") {
      rtrfw_filename = input;
      rtrfw_filename.addEventListener("change", function () {
        handleRtrUpdateButton();
      });
    } else if (input.accept === ".bin") {
      modfw_filename = input;
      modfw_filename.addEventListener("change", function () {
        handleModUpdateButton();
      });
    }
  }
});

let intervalId;
let pending;

if (document.getElementById("form_doc")) {
  form_doc.addEventListener("submit", function () {
    file_popup.classList.remove("show");
  });
}
if (form_upload) {
  form_upload.addEventListener("change", function () {
    handleUploadButtonL();
  });
  form_upload.addEventListener("submit", function () {
    openMsgPopup("");
  });
}
if (file_upload_edit) {
  file_upload_edit.addEventListener("change", function () {
    handleUploadButton();
  });
  file_upload_edit.addEventListener("submit", function () {
    openMsgPopup("");
  });
  handleUploadButton();
}

if (file_button_l) {
  file_button_l.addEventListener("change", function () {
    handleLocalButton();
  });
  handleLocalButton();
}
if (sys_upload_l) {
  sys_upload_l.addEventListener("change", function () {
    handleUploadButtonL();
  });
  handleUploadButtonL();
}

if (document.getElementById("config_button")) {
  document
    .getElementById("config_button")
    .addEventListener("click", function () {
      wait_msg_popup.innerHTML = wait_msg_popup.innerHTML.replace(
        "ContentTitle",
        "Neue Initialisierung"
      );
      wait_msg_popup.innerHTML = wait_msg_popup.innerHTML.replace(
        "Upload",
        "Bitte warten..."
      );
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
      wait_msg_popup.innerHTML = wait_msg_popup.innerHTML.replace(
        "ContentTitle",
        "System wird neu geladen"
      );
      wait_msg_popup.innerHTML = wait_msg_popup.innerHTML.replace(
        "Upload",
        "Bitte warten..."
      );
      openMsgPopup("hub");
    });
  }
}
if (sys_upload) {
  if (sys_upload.length) {
    sys_upload[0].addEventListener("click", function () {
      wait_msg_popup.innerHTML = wait_msg_popup.innerHTML.replace(
        "ContentTitle",
        "System wird neu geladen"
      );
      wait_msg_popup.innerHTML = wait_msg_popup.innerHTML.replace(
        "Upload",
        "Bitte warten..."
      );
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
if (updates_butt)
  updates_butt.addEventListener("click", function () {
    updates_pop.classList.add("show");
    handleRtrUpdateButton();
    handleModUpdateButton();
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
function openMsgPopup(url) {
  if (file_popup) file_popup.classList.remove("show");
  wait_msg_popup.classList.add("show");
  if (updates_pop) updates_pop.classList.remove("show");
  if (url != "") {
    watchWaitStatus(url);
  }
}
function handleLocalButton() {
  if (file_button_l.selectedIndex) bak_restore[0].disabled = false;
  else {
    bak_restore[0].disabled = true;
  }
}

function handleUploadButtonL() {
  if (sys_upload_l.value == "") sys_upload[0].disabled = true;
  else {
    sys_upload[0].disabled = false;
  }
}

function handleUploadButton() {
  if (file_upload_edit.value == "") {
    sys_upload[0].disabled = true;
  } else {
    sys_upload[0].disabled = false;
  }
}
function handleRtrUpdateButton() {
  if (rtrfw_filename.value == "") sys_upload[1].disabled = true;
  else {
    sys_upload[1].disabled = false;
  }
}
function handleModUpdateButton() {
  if (modfw_filename.value == "") sys_upload[2].disabled = true;
  else {
    sys_upload[2].disabled = false;
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
  const statusUrl = "wait_status";
  if (url == "") {
    url = "modules";
  }
  if (pending) return;
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
    })
    .catch(function (error) {
      pending = false;
      console.log(error);
    });
}
