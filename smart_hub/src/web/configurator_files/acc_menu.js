const menu_btn = document.getElementById("acc_img")
const el_left = document.getElementById("left")

if (document.body.clientWidth > 1012) {
    menu_btn.style.width = "0px"
}
else {
    el_left.classList.add('left-hide');
    if (menu_btn) {
        menu_btn.addEventListener("click", function () {
            toggle_acc_btn();
        });
    }
    if (el_left) {
        el_left.addEventListener("click", function () {
            toggle_acc_btn();
        });
    }
    document.addEventListener("click", function () {
        close_acc_btn();
    });
}


function toggle_acc_btn() {
    if (el_left.classList.contains('left-view')) {
        el_left.classList.remove('left-view');
        el_left.classList.add('left-hide');
    }
    else {
        el_left.classList.add('left-view');
        el_left.classList.remove('left-hide');
    }
};

function close_acc_btn() {
    if (event.target === document.documentElement) {
        el_left.classList.remove('left-view');
        el_left.classList.add('left-hide');
    }
}