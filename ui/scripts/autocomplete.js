let SHEETS = [];

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

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

        // Sort array to show favorites first
        arr.sort((a, b) => (favorites.includes(b[1]) - favorites.includes(a[1])));

        for (let i = 0; i < arr.length; i++) {
            if (arr[i][0].toUpperCase().includes(val.toUpperCase())) {
                let item = document.createElement("div");
                let isFavorite = favorites.includes(arr[i][1]);

                item.innerHTML = `<div><strong>${arr[i][0].substr(0, val.length)}</strong>${arr[i][0].substr(val.length)}`;
                item.innerHTML += `<input type='hidden' pdf='${arr[i][1]}' value='${arr[i][0]}'></div>`;
                item.innerHTML += `<span class='star'>${isFavorite ? '★' : '☆'}</span>`;

                item.addEventListener("click", function(e) {
                    let this_inp = this.getElementsByTagName("input")[0];
                    inp.value = this_inp.value;
                    inp.pdf = this_inp.getAttribute("pdf");

                    closeAllLists();
                    updatePDF(inp.pdf);
                    toggleFavorite(inp.pdf); // Toggle favorite status on click
                });
                listContainer.appendChild(item);
            }
        }
    });

    function toggleFavorite(pdf) {
        let index = favorites.indexOf(pdf);
        if (index > -1) {
            favorites.splice(index, 1); // Remove from favorites
        } else {
            favorites.push(pdf); // Add to favorites
        }
        localStorage.setItem('favorites', JSON.stringify(favorites)); // Update local storage
    }

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

let viewer = null;
function updatePDF(query) {
    console.log("query", query);
    let newSrc = "/sheets/" + query;
    let oldPdf = document.getElementById("viewer");
    if (query.endsWith(".pdf")) {
        document.getElementById("imageContainer").style.display = "none";
        let newPdf = document.createElement("embed");
        newPdf.setAttribute("id", "viewer");
        newPdf.setAttribute("src", newSrc);
        oldPdf.parentNode.replaceChild(newPdf, oldPdf);
    } else {
        viewer = new Viewer(document.getElementById('imageViewer'), {
            inline: true,
            viewed() {
                viewer.zoomTo(2);
            },
        });
        viewer.show();
        oldPdf.style.display = "none";
        document.getElementById("imageContainer").style.display = "flex";
        document.getElementById("imageViewer").src = newSrc;
    }
}

window.addEventListener('load_sheets', function(sheets) {
    SHEETS = sheets.detail.sheets.map(category => category.sheets.map(sheet => [sheet.title, sheet.path])).flat();
    autocomplete(document.getElementById("query-input"), SHEETS);
});
