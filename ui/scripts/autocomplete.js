let SHEETS = [];

function autocomplete(inp, arr) {
    let currentFocus;

    inp.addEventListener("input", function(e) {
        let val = this.value;
        closeAllLists();
        if (!val) return false;
        currentFocus = -1;

        let listContainer = document.createElement("div");
        listContainer.setAttribute("id", this.id + "autocomplete-list");
        listContainer.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(listContainer);

        for (let i = 0; i < arr.length; i++) {
            if (arr[i][0].substr(0, val.length).toUpperCase() === val.toUpperCase()) {
                let item = document.createElement("div");
                item.innerHTML = "<strong>" + arr[i][0].substr(0, val.length) + "</strong>";
                item.innerHTML += arr[i][0].substr(val.length);
                item.innerHTML += "<input type='hidden' pdf=\"" + arr[i][1] + "\" value='" + arr[i][0] + "'>";
                
                item.addEventListener("click", function(e) {
                    // Setting the input value to the selected item
                    let this_inp = this.getElementsByTagName("input")[0];
                    inp.value = this_inp.value;
                    inp.pdf = this_inp.getAttribute("pdf");

                    closeAllLists();
                    updatePDF(inp.pdf);  // Call to update the PDF display
                });
                listContainer.appendChild(item);
            }
        }
    });

    inp.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode === 40) {  // Down arrow
            currentFocus++;
            addActive(x);
        } else if (e.keyCode === 38) { // Up arrow
            currentFocus--;
            addActive(x);
        } else if (e.keyCode === 13) {  // Enter
            e.preventDefault();
            if (currentFocus > -1 && x) {
                x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = x.length - 1;
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        let x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt !== x[i] && elmnt !== inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

function updatePDF(query) {
    console.log("query", query);
    let newSrc = "/sheets/" + query;
    let oldPdf = document.getElementById("pdf");
    let newPdf = document.createElement("embed");
    newPdf.setAttribute("id", "pdf");
    newPdf.setAttribute("src", newSrc);
    newPdf.setAttribute("width", "100%");
    newPdf.setAttribute("height", "1000rem");
    oldPdf.parentNode.replaceChild(newPdf, oldPdf);
}

window.addEventListener('load_sheets', function(sheets) {
    SHEETS = sheets.detail.sheets.map(category => category.sheets.map(sheet => [sheet.title, sheet.path])).flat();
    autocomplete(document.getElementById("query-input"), SHEETS);
});
